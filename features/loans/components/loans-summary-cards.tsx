"use client"

import { ArrowDownIcon, ArrowUpIcon, ScaleIcon } from "lucide-react"

import { groupLoansByPerson } from "@/features/loans/lib/group-loans"
import { type Loan, type LoanCurrency, type LoanDirection } from "@/features/loans/types/loan-types"
import { formatCurrency } from "@/lib/format"

type LoansSummaryCardsProps = {
  loans: Loan[]
}

function pendingByCurrency(loans: Loan[], direction: LoanDirection) {
  const totals = new Map<LoanCurrency, number>()
  for (const loan of loans) {
    if (loan.isSettled || loan.direction !== direction) continue
    totals.set(loan.currency, (totals.get(loan.currency) ?? 0) + loan.pendingAmount)
  }
  return [...totals.entries()].filter(([, amount]) => amount > 0)
}

function formatAmounts(items: [LoanCurrency, number][]) {
  if (items.length === 0) return formatCurrency(0)
  return items.map(([currency, amount]) => formatCurrency(amount, currency)).join(" · ")
}

function netByCurrency(loans: Loan[]) {
  const totals = new Map<LoanCurrency, number>()
  for (const loan of loans) {
    if (loan.isSettled) continue
    const signed = loan.direction === "lent" ? loan.pendingAmount : -loan.pendingAmount
    totals.set(loan.currency, (totals.get(loan.currency) ?? 0) + signed)
  }
  return [...totals.entries()].filter(([, amount]) => amount !== 0)
}

export function LoansSummaryCards({ loans }: LoansSummaryCardsProps) {
  const groups = groupLoansByPerson(loans)
  const activeLent = groups.filter((group) => !group.isSettled && group.direction === "lent")
  const activeBorrowed = groups.filter((group) => !group.isSettled && group.direction === "borrowed")
  const toReceive = pendingByCurrency(loans, "lent")
  const toPay = pendingByCurrency(loans, "borrowed")
  const net = netByCurrency(loans)
  const isNetPositive = net.every(([, amount]) => amount >= 0)

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <ArrowDownIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Me deben</p>
          <p className="truncate text-xs text-muted-foreground">
            {activeLent.length} persona{activeLent.length !== 1 ? "s" : ""}
          </p>
        </div>
        <p className="text-right text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
          {formatAmounts(toReceive)}
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
          <ArrowUpIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Debo</p>
          <p className="truncate text-xs text-muted-foreground">
            {activeBorrowed.length} persona{activeBorrowed.length !== 1 ? "s" : ""}
          </p>
        </div>
        <p className="text-right text-lg font-semibold tabular-nums text-destructive">
          {formatAmounts(toPay)}
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${isNetPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
          <ScaleIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Balance neto</p>
          <p className="truncate text-xs text-muted-foreground">{isNetPositive ? "A tu favor" : "Por moneda"}</p>
        </div>
        <p className={`text-right text-lg font-semibold tabular-nums ${isNetPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
          {net.length === 0
            ? formatCurrency(0)
            : net.map(([currency, amount]) => formatCurrency(Math.abs(amount), currency)).join(" · ")}
        </p>
      </div>
    </div>
  )
}
