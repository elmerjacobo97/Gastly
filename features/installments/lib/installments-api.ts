import { endOfMonth, format, startOfMonth } from "date-fns"

import {
  type InstallmentPayment,
  type InstallmentPurchase,
} from "@/features/installments/types/installment-types"

export function getMonthInstallments(
  purchases: InstallmentPurchase[],
  month: Date
): Array<{ payment: InstallmentPayment; purchase: InstallmentPurchase }> {
  const monthStart = format(startOfMonth(month), "yyyy-MM-dd")
  const monthEnd = format(endOfMonth(month), "yyyy-MM-dd")

  const installments: Array<{ payment: InstallmentPayment; purchase: InstallmentPurchase }> = []

  for (const purchase of purchases) {
    for (const payment of purchase.payments) {
      if (payment.dueOn >= monthStart && payment.dueOn <= monthEnd) {
        installments.push({ payment, purchase })
      }
    }
  }

  return installments
}
