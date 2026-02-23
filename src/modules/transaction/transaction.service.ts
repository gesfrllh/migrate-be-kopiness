import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { PaymentMethod, Transaction, TransactionStatus, UserRole } from "@prisma/client";
import { mapToCashierDto } from "./dto/cashier-transaction.mapper";
import { CashierTransactionDto } from "./dto/cashier-transaction.dto";
import { formatOrderNumber, generateInvoiceNumber } from "src/common/utils/general";
import { PayTransactionsDto } from "./dto/cashier-payment.dto";
import { PaymentService } from "../payment/payment.service";
import { AdminHistoryQueryDto } from "./dto/admin-history-query.dto";
import { UserHistoryQueryDto } from "./dto/user-history-query.dto";
import { TransactionMapper } from "./dto/transaction.mapper";

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService
  ) { }

  async createFromCart(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<CashierTransactionDto> {

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const productId = dto.items.map(i => i.productId)

    // ✅ PARALLEL
    const [products, seq] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: productId } },
        select: { id: true, name: true, price: true, stock: true }
      }),
      this.prisma.orderSequence.upsert({
        where: { date: today },
        update: { value: { increment: 1 } },
        create: { date: today, value: 1 }
      })
    ])

    const productMap = new Map(products.map(p => [p.id, p]))
    let total = 0

    for (const item of dto.items) {
      const product = productMap.get(item.productId)
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`)
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Stock not enough for ${product.name}`)
      }
      total += product.price * item.quantity
    }

    const orderNumber = formatOrderNumber(today, seq.value)

    // ✅ SPLIT: Buat transaction dulu, items terpisah (LEBIH CEPAT)
    const transactionId = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          orderNumber,
          createdBy: { connect: { id: userId } },
          status: TransactionStatus.PENDING,
          total,
        },
        select: { id: true }
      })

      // ✅ Batch insert items (1 query untuk semua items)
      await tx.transactionItem.createMany({
        data: dto.items.map(item => ({
          transactionId: created.id,
          productId: item.productId,
          quantity: item.quantity
        }))
      })

      return created.id
    })

    // ✅ Query final result di luar transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        items: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: { id: true, name: true, price: true }
            }
          }
        }
      }
    })

    return mapToCashierDto(transaction)
  }
  async getCashierQueue() {

    const transactions = await this.prisma.transaction.findMany({
      where: {
        status: TransactionStatus.PENDING,
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        }
      },
      take: 50 // ✅ Limit hasil kalau banyak (optional)
    })
    return transactions.map(mapToCashierDto)
  }
  async getById(id: string) {
    const trx = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true }
        },
        createdBy: true
      }
    })

    if (!trx) {
      throw new NotFoundException('Transaction Not found')
    }

    return trx
  }

  async cancel(id: string) {
    const trx = await this.getById(id)

    if (trx.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction Cannot be cancelled')
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        status: TransactionStatus.CANCELLED
      }
    })
  }

  async pay(dto: PayTransactionsDto) {
    const { transactionIds, method } = dto

    const paymentMethod = this.paymentService.getMethodById(method)
    if (!paymentMethod) {
      throw new BadRequestException('Payment method not Valid!')
    }

    return this.prisma.$transaction(async (tx) => {

      const transactions = await tx.transaction.findMany({
        where: {
          id: { in: transactionIds },
          status: TransactionStatus.PENDING
        },
        include: {
          items: true
        }
      })

      if (transactions.length !== transactionIds.length) {
        throw new NotFoundException('Some transaction not found')
      }

      const totalAmount = transactions.reduce(
        (sum, trx) => sum + trx.total,
        0
      )

      const invoiceNumber = generateInvoiceNumber()
      const paidAt = new Date()

      // 🔥 Atomic stock update (no manual check)
      await Promise.all(
        transactions.flatMap(trx =>
          trx.items.map(async item => {
            const result = await tx.product.updateMany({
              where: {
                id: item.productId,
                stock: {
                  gte: item.quantity
                }
              },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            })

            if (result.count === 0) {
              throw new BadRequestException(
                `Stock not enough for product ${item.productId}`
              )
            }
          })
        )
      )

      const payment = await tx.payment.create({
        data: {
          invoiceNumber,
          totalAmount,
          method,
          paidAt
        }
      })

      await tx.transaction.updateMany({
        where: {
          id: { in: transactionIds }
        },
        data: {
          status: TransactionStatus.PAID,
          paymentId: payment.id
        }
      })

      return {
        message: 'Payment success',
        payment
      }
    })

  }
  // ===================================
  // ADMIN SUMMARY
  // ===================================
  async getAdminSummary() {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))

    const [totalRevenue, todayRevenue, totalTransactions] =
      await Promise.all([
        this.prisma.transaction.aggregate({
          _sum: { total: true },
          where: { status: 'PAID' },
        }),
        this.prisma.transaction.aggregate({
          _sum: { total: true },
          where: {
            status: 'PAID',
            createdAt: { gte: startOfDay },
          },
        }),
        this.prisma.transaction.count({
          where: { status: 'PAID' },
        }),
      ])

    return {
      totalRevenue: totalRevenue._sum.total || 0,
      todayRevenue: todayRevenue._sum.total || 0,
      totalTransactions,
    }
  }

  async getDetail(id: string) {
    const trx = this.prisma.transaction.findUnique({
      where: { id },
      include: {
        createdBy:
        {
          select:
          {
            id: true,
            name: true,
            email: true
          }
        },
        payment: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!trx) {
      throw new NotFoundException('Transaction not found')
    }

    return trx
  }
  private buildAdminWhere(query: AdminHistoryQueryDto) {
    const where: any = {}

    if (query.status) where.status = query.status
    if (query.method) {
      where.payment = {
        is: {
          method: query.method
        }
      }
    }
    if (query.userId) where.userId = query.userId
    if (query.search) {
      where.OR = [
        { id: { contains: query.search } },
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
      ]
    }
    if (query.startDate) where.createdAt = { ...where.createdAt, gte: new Date(query.startDate) }
    if (query.endDate) where.createdAt = { ...where.createdAt, lte: new Date(query.endDate) }

    return where
  }

  async getAdminHistory(query: AdminHistoryQueryDto) {
    const { page = 1, limit = 20 } = query
    const skip = (page - 1) * limit

    const where = this.buildAdminWhere(query)

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          payment: { select: { method: true, invoiceNumber: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ])

    return {
      data: data.map(TransactionMapper.toAdminHistoryDto),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getUserHistory(userId: string, query: UserHistoryQueryDto) {
    const { page = 1, limit = 10 } = query
    const skip = (page - 1) * limit

    const where: any = { createdById: userId }

    if (query.search) {
      where.OR = [
        { id: { contains: query.search } },
        { orderNumber: { contains: query.search } },
      ]
    }
    if (query.startDate) where.createdAt = { ...where.createdAt, gte: new Date(query.startDate) }
    if (query.endDate) where.createdAt = { ...where.createdAt, lte: new Date(query.endDate) }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: { select: { method: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ])

    return {
      data: data.map(TransactionMapper.toHistoryDto),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getHistory(user: any, query: AdminHistoryQueryDto) {
    const isAdmin = user.role === UserRole.ADMIN
    return isAdmin
      ? this.getAdminHistory(query)
      : this.getUserHistory(user.id, query)
  }

}