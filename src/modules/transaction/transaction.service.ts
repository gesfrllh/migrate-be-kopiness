import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { PaymentMethod, TransactionStatus } from "@prisma/client";
import { mapToCashierDto } from "./dto/cashier-transaction.mapper";
import { CashierTransactionDto } from "./dto/cashier-transaction.dto";
import { formatOrderNumber, generateInvoiceNumber } from "src/common/utils/general";
import { PayTransactionsDto } from "./dto/cashier-payment.dto";
import { PaymentService } from "../payment/payment.service";

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
    // ✅ Pastikan ada index di schema.prisma:
    // @@index([status, createdAt])

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

    const transactions = await this.prisma.transaction.findMany({
      where: {
        id: { in: transactionIds }
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    })

    if (transactions.length !== transactionIds.length) {
      throw new NotFoundException('Some transaction not found')
    }

    for (const trx of transactions) {
      if (trx.status !== TransactionStatus.PENDING) {
        throw new BadRequestException(`Transaction ${trx.id} cannot be paid`)
      }

      for (const items of trx.items) {
        if (items.product.stock < items.quantity) {
          throw new BadRequestException(`Stock not enough for ${items.product.name}`)
        }
      }
    }

    const totalAmount = transactions.reduce(
      (sum, trx) => sum + trx.total,
      0
    )

    const invoiceNumber = generateInvoiceNumber()
    const paidAt = new Date()

    const result = await this.prisma.$transaction(async tx => {
      for (const trx of transactions) {
        for (const item of trx.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        }
      }

      const payment = await tx.payment.create({
        data: {
          invoiceNumber,
          totalAmount,
          method,
          paidAt
        }
      })

      const updateTransaction = await Promise.all(
        transactions.map(trx =>
          tx.transaction.update({
            where: { id: trx.id },
            data: {
              status: TransactionStatus.PAID,
              paymentId: payment.id
            },
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          })
        )
      )
      return {
        payment,
        transaction: updateTransaction
      }
    })

    return {
      mesage: 'Payment success',
      payment: result.payment,
      transaction: result.transaction
    }
  }
}