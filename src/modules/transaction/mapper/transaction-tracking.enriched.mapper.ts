import { TransactionAction } from "@prisma/client";
import { TransactionTrackingItemDto } from "../tracking-dto/item.dto";
import { ORDER_TRACKING_STEPS } from "../tracking-dto/transaction-tracking.steps";

export function buildOrderTracking(
  timeline: TransactionTrackingItemDto[]
) {
  const actionMap = new Map(timeline.map((t) => [t.action, t]))

  const lastCompletedStep =
    timeline[timeline.length - 1]?.step ?? 0

  const progressPercent =
    (lastCompletedStep / ORDER_TRACKING_STEPS.length) * 100

  const steps = ORDER_TRACKING_STEPS.map((step) => {
    const completed = actionMap.has(step.action as TransactionAction)

    const active =
      completed &&
      step.step === lastCompletedStep

    return {
      ...step,
      completed,
      active,
      timestamp: actionMap.get(step.action as TransactionAction)?.createdAt ?? null
    }
  })

  return {
    progressPercent,
    steps
  }
}