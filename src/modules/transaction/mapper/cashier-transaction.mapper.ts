// mapper/cashier-transaction.mapper.ts
import { CashierTransactionDto } from '../dto/cashier-transaction.dto'

export function mapToCashierDto(trx): CashierTransactionDto {
  const items = trx.items.map(item => ({
    productId: item.product.id,
    productName: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    stock: item.product.stock,
    subtotal: item.product.price * item.quantity,
  }))

  return {
    id: trx.id,
    status: trx.status,
    createdAt: trx.createdAt,
    orderNumber: trx.orderNumber,

    user: {
      id: trx.createdBy.id,
      name: trx.createdBy.name,
      email: trx.createdBy.email,
    },

    items,
    totalItem: items.reduce((sum, i) => sum + i.quantity, 0),
    estimatedTotal: items.reduce((sum, i) => sum + i.subtotal, 0),
  }
}
