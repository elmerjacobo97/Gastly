import { format } from "date-fns"

export function getNextPaymentDefault(): string {
  const today = new Date()
  const candidate = new Date(today.getFullYear(), today.getMonth(), 20)
  if (today.getDate() > 20) candidate.setMonth(candidate.getMonth() + 1)
  return format(candidate, "yyyy-MM-dd")
}
