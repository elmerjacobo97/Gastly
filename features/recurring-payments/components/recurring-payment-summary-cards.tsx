"use client"

import { CalendarIcon, CheckCircle2Icon, ClockIcon } from "lucide-react"

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
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${allPaid ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted/50 text-muted-foreground"}`}>
          <CalendarIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Programado este mes</p>
          {allPaid && <p className="truncate text-xs text-muted-foreground">todo pagado</p>}
        </div>
        <p className={`text-lg font-semibold tabular-nums ${allPaid ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
          {formatCurrency(totalCommitted)}
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Pagado este mes</p>
        </div>
        <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
          {formatCurrency(totalPaid)}
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <ClockIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Falta pagar este mes</p>
        </div>
        <p className="text-lg font-semibold tabular-nums text-amber-600 dark:text-amber-400">
          {formatCurrency(totalPending)}
        </p>
      </div>
    </div>
  )
}
