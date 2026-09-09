"use client"

import { WalletIcon, PiggyBankIcon, ReceiptIcon, TrendingDownIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

type BudgetPlanSummaryProps = {
  hasPlan: boolean
  availableForBudget: number
  unassigned: number
  totalBudget: number
  totalSpent: number
}

export function BudgetPlanSummary({
  hasPlan,
  availableForBudget,
  unassigned,
  totalBudget,
  totalSpent,
}: BudgetPlanSummaryProps) {
  if (!hasPlan) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        Crea tu plan mensual para saber cuánto puedes asignar a presupuestos.
      </div>
    )
  }

  const remaining = totalBudget - totalSpent

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">Disponible libre</CardTitle>
            <CardAction>
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground">
                <WalletIcon className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {formatCurrency(availableForBudget)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {unassigned >= 0 ? "Sin asignar" : "Sobreasignado"}
            </CardTitle>
            <CardAction>
              <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${unassigned >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                <PiggyBankIcon className="size-5" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold tabular-nums ${unassigned >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
              {formatCurrency(Math.abs(unassigned))}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">Total gastado</CardTitle>
            <CardAction>
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
                <ReceiptIcon className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold tabular-nums text-destructive">
              {formatCurrency(totalSpent)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">Restante</CardTitle>
            <CardAction>
              <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${remaining >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                <TrendingDownIcon className="size-5" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold tabular-nums ${remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
              {formatCurrency(Math.max(remaining, 0))}
            </p>
          </CardContent>
        </Card>
      </div>
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          unassigned >= 0
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-destructive/30 bg-destructive/10 text-destructive"
        }`}
      >
        {unassigned >= 0
          ? `Todavía puedes asignar ${formatCurrency(unassigned)} a presupuestos variables.`
          : `Tus presupuestos superan tu disponible libre por ${formatCurrency(Math.abs(unassigned))}.`}
      </div>
    </>
  )
}
