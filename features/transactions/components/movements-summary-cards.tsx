"use client"

import { ArrowDownIcon, ArrowUpIcon, ScaleIcon } from "lucide-react"

import { formatCurrency } from "@/lib/format"

type MovementsSummaryCardsProps = {
  income: number
  expense: number
  incomeCount: number
  expenseCount: number
}

export function MovementsSummaryCards({
  income,
  expense,
  incomeCount,
  expenseCount,
}: MovementsSummaryCardsProps) {
  const diff = income - expense

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <ArrowUpIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Ingresos</p>
          <p className="truncate text-xs text-muted-foreground">{incomeCount} registro{incomeCount !== 1 ? "s" : ""}</p>
        </div>
        <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
          {formatCurrency(income)}
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
          <ArrowDownIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Gastos</p>
          <p className="truncate text-xs text-muted-foreground">{expenseCount} registro{expenseCount !== 1 ? "s" : ""}</p>
        </div>
        <p className="text-lg font-semibold tabular-nums text-destructive">
          {formatCurrency(expense)}
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${diff >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
          <ScaleIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Diferencia</p>
        </div>
        <p className={`text-lg font-semibold tabular-nums ${diff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
          {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
        </p>
      </div>
    </div>
  )
}
