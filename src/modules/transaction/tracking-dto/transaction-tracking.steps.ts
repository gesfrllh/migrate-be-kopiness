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
  { step: 4, action: 'ACCEPTED', label: 'Pesanan diterima' },
  { step: 5, action: 'PREPARING', label: 'Pesanan disiapkan' },
  { step: 6, action: 'HANDED_TO_COURIER', label: 'Pesanan diserahkan ke kurir' },
  { step: 7, action: 'ON_DELIVERY', label: 'Pesanan sedang diantar' },
  {
    step: 8,
    action: 'DELIVERED',
    label: 'Pesanan selesai',
  },
]
