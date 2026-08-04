import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { PaymentMethod, Transaction, TransactionAction, TransactionStatus, UserRole } from "@prisma/client";
import { mapToCashierDto } from "./mapper/cashier-transaction.mapper";
import { CashierTransactionDto } from "./dto/cashier-transaction.dto";
import { formatOrderNumber, generateInvoiceNumber } from "src/common/utils/general";
import { PayTransactionsDto } from "./dto/cashier-payment.dto";
import { PaymentService } from "../payment/payment.service";
import { AdminHistoryQueryDto } from "./dto/admin-history-query.dto";
import { UserHistoryQueryDto } from "./dto/user-history-query.dto";
import { TransactionMapper } from "./dto/transaction.mapper";
import { TransactionTrackingResponseDto } from "./tracking-dto/response.dto";
import { mapLogsToTracking } from "./mapper/transaction-tracking.mapper";
import { buildOrderTracking } from "./mapper/transaction-tracking.enriched.mapper";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { UpdateCourierLocationDto } from "./dto/update-courier-location.dto";
import { canTransitionOrder } from "./config/order-lifecycle";

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
    const quantities = new Map<string, number>()
    for (const item of dto.items) {
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)
    }
    const items = [...quantities].map(([productId, quantity]) => ({ productId, quantity }))
    const productId = items.map(i => i.productId)

    const [products, seq] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: productId } },
        select: { id: true, name: true, price: true, stock: true, storeId: true }
      }),
      this.prisma.orderSequence.upsert({
        where: { date: today },
        update: { value: { increment: 1 } },
        create: { date: today, value: 1 }
      })
    ])

    const productMap = new Map(products.map(p => [p.id, p]))
    let total = 0

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`)
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Stock not enough for ${product.name}`)
      }
      total += product.price * item.quantity
    }

    const storeIds = new Set(products.map((product) => product.storeId))
    if (storeIds.size !== 1 || storeIds.has(null)) {
      throw new BadRequestException('All products in an order must belong to the same store')
    }

    const orderNumber = formatOrderNumber(today, seq.value)

    const firstProduct = products[0]
    const storeId = firstProduct?.storeId ?? undefined

    const transactionId = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          orderNumber,
          createdBy: { connect: { id: userId } },
          status: TransactionStatus.PENDING,
          total,
          deliveryAddress: dto.deliveryAddress,
          deliveryLatitude: dto.deliveryLatitude,
          deliveryLongitude: dto.deliveryLongitude,
          ...(storeId ? { store: { connect: { id: storeId } } } : {}),
        },
        select: { id: true }
      })

      await tx.transactionItem.createMany({
        data: items.map(item => ({
          transactionId: created.id,
          productId: item.productId,
          quantity: item.quantity,
          price: productMap.get(item.productId)!.price || 0,
        }))
      })

      await tx.transactionLog.create({
        data: {
          transactionId: created.id,
          action: 'CREATED',
          message: 'Pesanan berhasil dibuat',
        },
      })

      return created.id
    })

    await this.prisma.cartItem.deleteMany({
      where: { cart: { userId } },
    })

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
  async getCashierQueue(user: { id: string; role: UserRole }) {
    const where: { status: TransactionStatus; store?: { ownerId: string } } = {
      status: TransactionStatus.PENDING,
    }
    if (user.role === UserRole.STOREOWNER) {
      where.store = { ownerId: user.id }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
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

  async cancel(id: string, userId: string) {
    const trx = await this.getById(id)

    if (trx.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction Cannot be cancelled')
    }

    if (trx.createdById !== userId) {
      throw new ForbiddenException('You do not own this transaction')
    }

    await this.prisma.transactionLog.create({
      data: {
        transactionId: id,
        action: 'CANCELLED',
        message: 'Pesanan dibatalkan oleh customer',
      },
    })

    return this.prisma.transaction.update({
      where: { id },
      data: {
        status: TransactionStatus.CANCELLED
      }
    })
  }

  async pay(dto: PayTransactionsDto, user: { id: string; role: UserRole }) {
    const { transactionIds, method } = dto

    const paymentMethod = this.paymentService.getMethodById(method)
    if (!paymentMethod) {
      throw new BadRequestException('Payment method not Valid!')
    }

    return this.prisma.$transaction(async (tx) => {

      const transactions = await tx.transaction.findMany({
        where: {
          id: { in: transactionIds },
          status: TransactionStatus.PENDING,
          ...(user.role === UserRole.STOREOWNER ? { store: { ownerId: user.id } } : {}),
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

      for (const trx of transactions) {
        await tx.transactionLog.create({
          data: {
            transactionId: trx.id,
            action: 'PAYMENT_STARTED',
            message: 'Pembayaran dimulai',
            meta: { method },
          },
        })
      }

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

      for (const trx of transactions) {
        await tx.transactionLog.create({
          data: {
            transactionId: trx.id,
            action: 'STOCK_DEDUCTED',
            message: 'Stok berhasil dikurangi',
          },
        })
      }

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

      for (const trx of transactions) {
        await tx.transactionLog.create({
          data: {
            transactionId: trx.id,
            action: 'PAID',
            message: 'Pembayaran berhasil',
            meta: { invoiceNumber, method },
          },
        })
      }

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

  async getDetail(id: string, user: { id: string; role: UserRole }) {
    // const trx = this.prisma.transaction.findUnique({
    //   where: { id },
    //   include: {
    //     createdBy:
    //     {
    //       select:
    //       {
    //         id: true,
    //         name: true,
    //         email: true
    //       }
    //     },
    //     payment: true,
    //     items: {
    //       include: {
    //         product: true
    //       }
    //     }
    //   }
    // })

    // if (!trx) {
    //   throw new NotFoundException('Transaction not found')
    // }

    // return trx

    const trx = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          },
        },

        store: {
          select: { ownerId: true },
        },

        courier: {
          select: { id: true, name: true },
        },
        payment: true,

        items: {
          include: {
            product: true
          }
        },

        transactionLogs: {
          orderBy: {
            createdAt: 'asc'
          },

          select: {
            action: true,
            meta: true,
            createdAt: true,
            message: true,
          }
        }
      }
    })

    if (!trx) {
      throw new NotFoundException(
        'Transaction not found'
      )
    }

    const ownsTransaction = trx.createdBy.id === user.id
    const ownsStore = user.role === UserRole.STOREOWNER && trx.store?.ownerId === user.id
    if (user.role !== UserRole.SUPERADMIN && !ownsTransaction && !ownsStore) {
      throw new ForbiddenException('You do not have access to this transaction')
    }

    const timeline = mapLogsToTracking(
      trx.transactionLogs
    )

    const { steps, progressPercent } = buildOrderTracking(timeline)

    return {
      id: trx.id,
      orderNumber: trx.orderNumber,
      status: trx.status,
      total: trx.total,
      createAt: trx.createdAt,
      paymentId: trx.paymentId,
      createdBy: trx.createdBy,
      payment: trx.payment,
      items: trx.items,
        tracking: {
          timeline,
          steps,
          progressPercent,
          courier: trx.courier,
          location: trx.locationUpdatedAt ? {
            latitude: trx.courierLatitude,
            longitude: trx.courierLongitude,
            updatedAt: trx.locationUpdatedAt,
          } : null,
          destination: {
            address: trx.deliveryAddress,
            latitude: trx.deliveryLatitude,
            longitude: trx.deliveryLongitude,
          },
        }
    }
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
    const isAdmin = user.role === UserRole.SUPERADMIN
    return isAdmin
      ? this.getAdminHistory(query)
      : this.getUserHistory(user.id, query)
  }

  async getStoreOrders(userId: string, query: { page?: number; limit?: number; status?: string }) {
    const userStores = await this.prisma.store.findMany({
      where: { ownerId: userId, isActive: true },
      select: { id: true },
    })
    if (userStores.length === 0) throw new NotFoundException('You have no active stores')

    const storeIds = userStores.map(s => s.id)
    const page = query.page || 1
    const limit = query.limit || 20
    const skip = (page - 1) * limit

    const where: any = { storeId: { in: storeIds } }
    if (query.status) where.status = query.status

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          payment: { select: { method: true, invoiceNumber: true } },
          items: {
            include: { product: { select: { id: true, name: true, price: true } } },
          },
          store: { select: { id: true, name: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ])

    return {
      data: data.map((transaction) => ({
        id: transaction.id,
        orderNumber: transaction.orderNumber,
        customer: transaction.createdBy.name,
        status: transaction.status,
        total: transaction.total,
        createdAt: transaction.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getCourierOrders(courierId: string) {
    return this.prisma.transaction.findMany({
      where: {
        courierId,
        status: { in: [TransactionStatus.HANDED_TO_COURIER, TransactionStatus.ON_DELIVERY] },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        store: { select: { name: true, address: true, phone: true } },
        createdBy: { select: { name: true } },
        items: { select: { quantity: true, product: { select: { name: true } } } },
      },
    })
  }

  async updateStatus(id: string, userId: string, dto: UpdateStatusDto) {
    const trx = await this.prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        courierId: true,
        storeId: true,
        store: { select: { ownerId: true } },
      },
    })

    if (!trx) throw new NotFoundException('Transaction not found')
    const { status } = dto
    const isStoreOwner = trx.store?.ownerId === userId
    const isAssignedCourier = trx.courierId === userId
    const role = isStoreOwner ? UserRole.STOREOWNER : isAssignedCourier ? UserRole.COURIER : null
    if (!role) throw new ForbiddenException('You cannot update this order')
    if (status === TransactionStatus.HANDED_TO_COURIER && !trx.courierId) {
      throw new BadRequestException('Assign a courier before handing off this order')
    }
    if (!canTransitionOrder(trx.status, status, role)) {
      throw new BadRequestException(`Cannot change ${trx.status} to ${status}`)
    }

    await this.prisma.$transaction([
      this.prisma.transactionLog.create({
        data: {
          transactionId: id,
          action: status as TransactionAction,
          message: `Status diubah ke ${status}`,
        },
      }),
      this.prisma.transaction.update({
        where: { id },
        data: { status },
      }),
    ])

    return { message: `Status updated to ${status}` }
  }

  async assignCourier(id: string, userId: string, courierId: string) {
    const [trx, courier] = await Promise.all([
      this.prisma.transaction.findUnique({
        where: { id },
        select: { id: true, status: true, store: { select: { ownerId: true } } },
      }),
      this.prisma.user.findUnique({ where: { id: courierId }, select: { id: true, role: true, name: true } }),
    ])

    if (!trx) throw new NotFoundException('Transaction not found')
    if (trx.store?.ownerId !== userId) throw new ForbiddenException('You do not own this store')
    if (trx.status !== TransactionStatus.PREPARING) {
      throw new BadRequestException('Courier can only be assigned while order is being prepared')
    }
    if (!courier || courier.role !== UserRole.COURIER) {
      throw new BadRequestException('Courier not found')
    }

    await this.prisma.transaction.update({ where: { id }, data: { courierId } })
    return { message: 'Courier assigned', courier: { id: courier.id, name: courier.name } }
  }

  async updateCourierLocation(id: string, userId: string, dto: UpdateCourierLocationDto) {
    const trx = await this.prisma.transaction.findUnique({
      where: { id },
      select: { courierId: true, status: true },
    })
    if (!trx) throw new NotFoundException('Transaction not found')
    if (trx.courierId !== userId) throw new ForbiddenException('You are not assigned to this order')
    if (trx.status !== TransactionStatus.ON_DELIVERY) {
      throw new BadRequestException('Location can only be updated while order is on delivery')
    }

    await this.prisma.transaction.update({
      where: { id },
      data: {
        courierLatitude: dto.latitude,
        courierLongitude: dto.longitude,
        locationUpdatedAt: new Date(),
      },
    })
    return { message: 'Courier location updated' }
  }

  async getTracking(id: string, user: { id: string; role: UserRole }): Promise<TransactionTrackingResponseDto> {
    const trx = await this.prisma.transaction.findUnique({
      where: { id },
      select: {
        createdById: true,
        courierLatitude: true,
        courierLongitude: true,
        locationUpdatedAt: true,
        deliveryAddress: true,
        deliveryLatitude: true,
        deliveryLongitude: true,
        courier: { select: { id: true, name: true } },
        store: { select: { ownerId: true } },
        orderNumber: true,
        status: true,
        transactionLogs: {
          orderBy: { createdAt: 'asc' },
          select: {
            action: true,
            meta: true,
            createdAt: true,
            message: true
          }
        }
      }


    })

    if (!trx) {
      throw new NotFoundException('Transaction Not Found')
    }

    const ownsTransaction = trx.createdById === user.id
    const ownsStore = user.role === UserRole.STOREOWNER && trx.store?.ownerId === user.id
    if (user.role !== UserRole.SUPERADMIN && !ownsTransaction && !ownsStore) {
      throw new ForbiddenException('You do not have access to this transaction')
    }

    const timeline = mapLogsToTracking(trx.transactionLogs)

    const { steps, progressPercent } = buildOrderTracking(timeline)

    return {
      orderNumber: trx.orderNumber as string,
      status: trx.status,
      progressPercent,
      timeline,
      steps,
      courier: trx.courier,
      location: trx.locationUpdatedAt ? {
        latitude: trx.courierLatitude,
        longitude: trx.courierLongitude,
        updatedAt: trx.locationUpdatedAt,
      } : null,
      destination: {
        address: trx.deliveryAddress,
        latitude: trx.deliveryLatitude,
        longitude: trx.deliveryLongitude,
      },
    }
  }

}
