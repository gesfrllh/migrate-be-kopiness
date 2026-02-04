import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { TransactionStatus } from "@prisma/client";
import { mapToCashierDto } from "./dto/cashier-transaction.mapper";
import { CashierTransactionDto } from "./dto/cashier-transaction.dto";

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) { }

  async createFromCart(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<CashierTransactionDto> {

    // 1️⃣ VALIDASI (READ ONLY)
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: dto.items.map(i => i.productId) },
      },
    })

    for (const item of dto.items) {
      const product = products.find(p => p.id === item.productId)
      if (!product) {
        throw new NotFoundException('Product not found')
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock not enough for ${product.name}`,
        )
      }
    }

    const product = await this.prisma.product.findMany({
      where: {
        id: { in: dto.items.map(i => i.productId) }
      }
    })

    const productMap = new Map(
      product.map(p => [p.id, p])
    )

    const total = dto.items.reduce((sum, item) => {
      const prdct = productMap.get(item.productId)

      if (!prdct) {
        throw new Error(`Product ${item.productId} not Found`)
      }

      return sum + prdct.price * item.quantity
    }, 0)

    // 2️⃣ WRITE (BATCH TRANSACTION — STABLE)
    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          createdById: userId,
          status: 'PENDING',
          total: total,
          items: {
            create: dto.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          createdBy: true,
        },
      }),
    ])

    return mapToCashierDto(transaction)
  }



  async getCashierQueue() {
    const transaction = this.prisma.transaction.findMany({
      where: {
        status: TransactionStatus.PENDING,
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        items: {
          include: {
            product: true,
          }
        },
        createdBy: true
      }
    })

    return (await transaction).map(mapToCashierDto)
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

  async pay(id: string) {
    const trx = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true }
        }
      }
    })

    if (!trx) throw new NotFoundException('Transaction not found')

    if (trx.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction Cannot be paid')
    }

    for (const item of trx.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(`Stock not enough for ${item.product.name}`)
      }
    }

    await this.prisma.$transaction([
      ...trx.items.map(item =>
        this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      ),

      this.prisma.transaction.update({
        where: { id },
        data: {
          status: TransactionStatus.PAID
        }
      })
    ])

    return { message: 'Payment Success' }
  }
}