import { TransactionStatus, UserRole } from '@prisma/client'
import { canTransitionOrder } from './order-lifecycle'

describe('canTransitionOrder', () => {
  it('allows only owner and assigned courier lifecycle transitions', () => {
    expect(canTransitionOrder(TransactionStatus.PAID, TransactionStatus.ACCEPTED, UserRole.STOREOWNER)).toBe(true)
    expect(canTransitionOrder(TransactionStatus.PREPARING, TransactionStatus.HANDED_TO_COURIER, UserRole.STOREOWNER)).toBe(true)
    expect(canTransitionOrder(TransactionStatus.HANDED_TO_COURIER, TransactionStatus.ON_DELIVERY, UserRole.COURIER)).toBe(true)
    expect(canTransitionOrder(TransactionStatus.PAID, TransactionStatus.DELIVERED, UserRole.STOREOWNER)).toBe(false)
    expect(canTransitionOrder(TransactionStatus.ON_DELIVERY, TransactionStatus.DELIVERED, UserRole.STOREOWNER)).toBe(false)
  })
})
