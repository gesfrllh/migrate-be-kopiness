import { TransactionStatus, UserRole } from '@prisma/client'

const storeTransitions: Partial<Record<TransactionStatus, TransactionStatus[]>> = {
  PAID: [TransactionStatus.ACCEPTED, TransactionStatus.REJECTED, TransactionStatus.CANCELLED],
  ACCEPTED: [TransactionStatus.PREPARING],
  PREPARING: [TransactionStatus.HANDED_TO_COURIER],
}

const courierTransitions: Partial<Record<TransactionStatus, TransactionStatus[]>> = {
  HANDED_TO_COURIER: [TransactionStatus.ON_DELIVERY],
  ON_DELIVERY: [TransactionStatus.DELIVERED],
}

export function canTransitionOrder(
  current: TransactionStatus,
  next: TransactionStatus,
  role: UserRole,
) {
  const transitions = role === UserRole.STOREOWNER ? storeTransitions : courierTransitions
  return transitions[current]?.includes(next) ?? false
}
