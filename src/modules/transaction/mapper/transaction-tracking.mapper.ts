import { TransactionAction } from "@prisma/client";
import { TRANSACTION_ACTION_CONFIG } from "../config/transaction-tracking.config";
import { TransactionTrackingItemDto } from "../tracking-dto/item.dto";

export function mapLogsToTracking(
  logs: {
    action: TransactionAction
    meta: any
    createdAt: Date
  }[],
): TransactionTrackingItemDto[] {
  return logs.flatMap((log) => {
    const config = TRANSACTION_ACTION_CONFIG[log.action]

    if (!config || !config.visible) {
      return [] // ⬅️ NO NULL, EVER
    }

    return [
      {
        step: config.step,
        action: log.action,
        label: config.label,
        description: config.description?.(log.meta),
        createdAt: log.createdAt,
      },
    ]
  })
}