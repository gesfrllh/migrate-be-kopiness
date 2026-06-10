export const ORDER_TRACKING_STEPS = [
  {
    step: 1,
    action: 'CREATED',
    label: 'Pesanan dibuat',
  },
  {
    step: 2,
    action: 'PAYMENT_STARTED',
    label: 'Menunggu pembayaran',
  },
  {
    step: 3,
    action: 'PAID',
    label: 'Pembayaran berhasil',
  },
  {
    step: 4,
    action: 'IN_PROGRESS',
    label: 'Pesanan diproses',
  },
  {
    step: 5,
    action: 'DELIVERED',
    label: 'Pesanan selesai',
  },
]