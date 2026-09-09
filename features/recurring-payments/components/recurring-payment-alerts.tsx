"use client"

import { format } from "date-fns"
import { AlertTriangleIcon, XCircleIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  daysLabel,
  daysUntilDue,
  isRelevantForMonth,
} from "@/features/recurring-payments/lib/recurring-payment-helpers"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"
import { formatCurrency, formatDate } from "@/lib/format"

type RecurringPaymentAlertsProps = {
  payments: RecurringPayment[]
  monthKey: string
}

export function RecurringPaymentAlerts({ payments, monthKey }: RecurringPaymentAlertsProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const unpaidActive = payments.filter(
    (p) => p.type === "expense" && p.isActive && !p.paidOn && isRelevantForMonth(p, monthKey)
  )
  const overduePayments = unpaidActive.filter((p) => p.nextDueOn < todayStr)
  const soonPayments = unpaidActive.filter((p) => {
    const days = daysUntilDue(p.nextDueOn, todayStr)
    return days >= 0 && days <= 7
  })

  if (overduePayments.length === 0 && soonPayments.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {overduePayments.length > 0 && (
        <Alert variant="destructive">
          <XCircleIcon />
          <AlertTitle>
            {overduePayments.length === 1
              ? `"${overduePayments[0].description}" está vencido`
              : `${overduePayments.length} pagos vencidos`}
          </AlertTitle>
          <AlertDescription>
            {overduePayments.length === 1
              ? `Vencía el ${formatDate(overduePayments[0].nextDueOn)}. Registra el pago para mantener el control.`
              : overduePayments.map((payment) => payment.description).join(", ")}
          </AlertDescription>
        </Alert>
      )}
      {soonPayments.length > 0 && (
        <Alert variant="warning">
          <AlertTriangleIcon />
          <AlertTitle>
            {soonPayments.length === 1
              ? `"${soonPayments[0].description}" ${daysLabel(soonPayments[0].nextDueOn, todayStr)}`
              : `${soonPayments.length} pagos próximos a vencer`}
          </AlertTitle>
          <AlertDescription>
            {soonPayments.length === 1
              ? formatCurrency(soonPayments[0].amount)
              : soonPayments.map((payment) => `${payment.description} (${daysLabel(payment.nextDueOn, todayStr)})`).join(", ")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
