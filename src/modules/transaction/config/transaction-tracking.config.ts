import { TransactionAction } from "@prisma/client";

export const TRANSACTION_ACTION_CONFIG: Record<
  TransactionAction,
  {
    label: string,
    description?: (meta: any) => string,
    visible: boolean,
    step: number
  }> = {
  CREATED: {
    step: 1,
    label: 'Pesanan Dibuat',
    visible: true
  },
  PAYMENT_STARTED: {
    step: 2,
    label: 'Menunggu Pembayaran',
    visible: true,
    description: (meta) =>
      meta?.method ? `Metode Pemabayaran: ${meta.method}` : '-'
  },
  STOCK_DEDUCTED: {
    step: 99, // internal
    label: 'Stok diproses',
    visible: false,
  },
  PAID: {
    step: 3,
    label: 'Pembayaran berhasil',
    visible: true,
    description: (meta) =>
      meta?.invoiceNumber
        ? `Invoice ${meta.invoiceNumber}`
        : '-',
  },
  CANCELLED: {
    step: 4,
    label: 'Pesanan dibatalkan',
    visible: true,
  },
  REFUNDED: {
    step: 5,
    label: 'Dana dikembalikan',
    visible: true,
  },
  ITEM_ADD: {
    step: 0,
    label: 'Item ditambahkan',
    visible: false,
  },

  PAYMENT_FAILED: {
    step: 98,
    label: 'Pembayaran gagal',
    visible: true,
    description: (meta) => meta?.reason ?? 'Pembayaran gagal',
  },
}