import { endOfMonth, format, startOfMonth } from "date-fns"

import {
  type InstallmentPayment,
  type InstallmentPurchase,
} from "@/features/installments/types/installment-types"

function isUnpaid(payment: InstallmentPayment) {
  return !payment.transactionId && !payment.paidExternally
}

function monthBounds(month: Date) {
  return {
    start: format(startOfMonth(month), "yyyy-MM-dd"),
    end: format(endOfMonth(month), "yyyy-MM-dd"),
  }
}

export function getMonthInstallments(
  purchases: InstallmentPurchase[],
  month: Date
): Array<{ payment: InstallmentPayment; purchase: InstallmentPurchase }> {
  const { start, end } = monthBounds(month)
  const installments: Array<{ payment: InstallmentPayment; purchase: InstallmentPurchase }> = []

  for (const purchase of purchases) {
    for (const payment of purchase.payments) {
      if (payment.dueOn >= start && payment.dueOn <= end) {
        installments.push({ payment, purchase })
      }
    }
  }

  return installments
}

export function getDisplayInstallment(
  purchase: InstallmentPurchase,
  month: Date
): InstallmentPayment | undefined {
  const { start, end } = monthBounds(month)
  const thisMonth = purchase.payments.find(
    (payment) => payment.dueOn >= start && payment.dueOn <= end
  )

  if (thisMonth && isUnpaid(thisMonth)) return thisMonth

  return purchase.payments.find((payment) => isUnpaid(payment) && payment.dueOn >= start)
}
