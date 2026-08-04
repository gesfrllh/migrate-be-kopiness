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
    step: 99, // 
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
  IN_PROGRESS: {
    step: 4,
    label: 'Pesanan Diproses',
    visible: true,
  },
  ACCEPTED: {
    step: 4,
    label: 'Pesanan diterima',
    visible: true,
  },
  REJECTED: {
    step: 4,
    label: 'Pesanan ditolak',
    visible: true,
  },
  PREPARING: {
    step: 5,
    label: 'Pesanan disiapkan',
    visible: true,
  },
  HANDED_TO_COURIER: {
    step: 6,
    label: 'Pesanan diserahkan ke kurir',
    visible: true,
  },
  ON_DELIVERY: {
    step: 7,
    label: 'Pesanan sedang diantar',
    visible: true,
  },
  DELIVERED: {
    step: 8,
    label: 'Pesanan Selesai',
    visible: true,
  },
}
