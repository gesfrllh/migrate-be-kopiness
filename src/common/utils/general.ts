import { randomBytes } from "crypto";

export function generateInvoiceNumber() {
  const date = new Date()
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '')
  const rdm = randomBytes(3).toString('hex').toUpperCase()

  return `INV-${ymd}-${rdm}`
}

export function formatOrderNumber(date: string, val: number) {
  return `ODR-${date}-${String(val).padStart(4, '0')}`
}