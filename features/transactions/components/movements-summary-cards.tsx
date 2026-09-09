"use client"

import { ArrowDownIcon, ArrowUpIcon, ScaleIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Ingresos</CardTitle>
          <CardAction>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowUpIcon className="size-5" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {incomeCount} registro{incomeCount !== 1 ? "s" : ""}
          </p>
          <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(income)}
          </p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Gastos</CardTitle>
          <CardAction>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
              <ArrowDownIcon className="size-5" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {expenseCount} registro{expenseCount !== 1 ? "s" : ""}
          </p>
          <p className="text-lg font-semibold tabular-nums text-destructive">
            {formatCurrency(expense)}
          </p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Diferencia</CardTitle>
          <CardAction>
            <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${diff >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
              <ScaleIcon className="size-5" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className={`text-lg font-semibold tabular-nums ${diff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
            {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
