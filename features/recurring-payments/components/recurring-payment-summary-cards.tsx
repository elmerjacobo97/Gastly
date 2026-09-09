"use client"

import { CalendarIcon, CheckCircle2Icon, ClockIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  isRelevantForMonth,
} from "@/features/recurring-payments/lib/recurring-payment-helpers"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"
import { formatCurrency } from "@/lib/format"

type RecurringPaymentSummaryCardsProps = {
  payments: RecurringPayment[]
  monthKey: string
}

export function RecurringPaymentSummaryCards({ payments, monthKey }: RecurringPaymentSummaryCardsProps) {
  const activeExpensePayments = payments.filter(
    (p) => p.type === "expense" && p.isActive && isRelevantForMonth(p, monthKey)
  )
  const totalCommitted = activeExpensePayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPaid = activeExpensePayments
    .filter((p) => p.paidOn)
    .reduce((sum, p) => sum + (p.paidAmount ?? p.amount), 0)
  const totalPending = Math.max(totalCommitted - totalPaid, 0)
  const allPaid = totalPending === 0

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Programado este mes</CardTitle>
          <CardAction>
            <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${allPaid ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted/50 text-muted-foreground"}`}>
              <CalendarIcon className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {allPaid && <p className="text-xs text-muted-foreground">todo pagado</p>}
          <p className={`text-lg font-semibold tabular-nums ${allPaid ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
            {formatCurrency(totalCommitted)}
          </p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Pagado este mes</CardTitle>
          <CardAction>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon className="size-5" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalPaid)}
          </p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Falta pagar este mes</CardTitle>
          <CardAction>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ClockIcon className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {formatCurrency(totalPending)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
