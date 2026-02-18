import { Prisma } from "@prisma/client";

type UserHistoryPayload = Prisma.TransactionGetPayload<{
  include: {
    payment: {
      select: { method: true, invoiceNumber: true }
    }
    _count: {
      select: { items: true }
    }
  }
}>

type AdminHistoryPayload = Prisma.TransactionGetPayload<{
  include: {
    createdBy: {
      select: { id: true, name: true, email: true }
    },
    payment: {
      select: { method: true, invoiceNumber: true }
    },
    _count: {
      select: { items: true }
    }
  }
}>

export class TransactionMapper {
  static toHistoryDto(trx: UserHistoryPayload) {
    return {
      id: trx.id,
      invoiceNumber: trx.payment?.invoiceNumber,
      status: trx.status,
      total: trx.total,
      orderNumber: trx.orderNumber,
      paymentMethod: trx.payment?.method ?? null,
      itemCount: trx._count.items,
      createdAt: trx.createdAt
    }
  }

  static toAdminHistoryDto(trx: AdminHistoryPayload) {
    return {
      id: trx.id,
      invoiceNumber: trx.payment?.invoiceNumber,
      status: trx.status,
      total: trx.total,
      createdAt: trx.createdAt,
      orderNumber: trx.orderNumber,
      paymentMethod: trx.payment?.method ?? null,
      itemCount: trx._count.items,
      customer: trx.createdBy ? {
        id: trx.createdBy.id,
        name: trx.createdBy.name,
        email: trx.createdBy.email
      } : null,
    }
  }
}