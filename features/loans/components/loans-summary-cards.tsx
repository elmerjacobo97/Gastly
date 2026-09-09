"use client"

import { ArrowDownIcon, ArrowUpIcon, ScaleIcon } from "lucide-react"

import { type Loan } from "@/features/loans/types/loan-types"
import { formatCurrency } from "@/lib/format"

type LoansSummaryCardsProps = {
  loans: Loan[]
}

export function LoansSummaryCards({ loans }: LoansSummaryCardsProps) {
  const activeLent = loans.filter((loan) => !loan.isSettled && loan.direction === "lent")
  const activeBorrowed = loans.filter((loan) => !loan.isSettled && loan.direction === "borrowed")
  const totalToReceive = activeLent.reduce((sum, loan) => sum + loan.pendingAmount, 0)
  const totalToPay = activeBorrowed.reduce((sum, loan) => sum + loan.pendingAmount, 0)
  const netBalance = totalToReceive - totalToPay
  const isNetPositive = netBalance >= 0

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <ArrowDownIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Me deben</p>
          <p className="truncate text-xs text-muted-foreground">{activeLent.length} préstamo{activeLent.length !== 1 ? "s" : ""} de cobro</p>
        </div>
        <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
          {formatCurrency(totalToReceive)}
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
          <ArrowUpIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Debo</p>
          <p className="truncate text-xs text-muted-foreground">{activeBorrowed.length} deuda{activeBorrowed.length !== 1 ? "s" : ""} por pagar</p>
        </div>
        <p className="text-lg font-semibold tabular-nums text-destructive">
          {formatCurrency(totalToPay)}
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${isNetPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
          <ScaleIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Balance neto</p>
          <p className="truncate text-xs text-muted-foreground">{isNetPositive ? "A tu favor" : "En tu contra"}</p>
        </div>
        <p className={`text-lg font-semibold tabular-nums ${isNetPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
          {formatCurrency(Math.abs(netBalance))}
        </p>
      </div>
    </div>
  )
}
