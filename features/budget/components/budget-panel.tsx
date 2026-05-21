"use client"

import { useQuery } from "@tanstack/react-query"
import { PiggyBankIcon } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/features/transactions/lib/format-transaction"
import { getBudgets } from "@/features/budget/lib/budget-api"
import {
  BudgetDeleteButton,
  BudgetDialog,
} from "@/features/budget/components/budget-dialog"
import { MonthNav } from "@/features/transactions/components/month-nav"

function usageColor(usage: number) {
  if (usage >= 100) return "text-destructive"
  if (usage >= 80) return "text-amber-600 dark:text-amber-400"
  return "text-emerald-600 dark:text-emerald-400"
}

function progressColor(usage: number) {
  if (usage >= 100) return "[&>div]:bg-destructive"
  if (usage >= 80) return "[&>div]:bg-amber-500"
  return "[&>div]:bg-emerald-500"
}

export function BudgetPanel() {
  const [month, setMonth] = useState(() => new Date())
  const budgetsQuery = useQuery({
    queryKey: ["budgets", month.toISOString().slice(0, 7)],
    queryFn: () => getBudgets(month),
  })
  const budgets = budgetsQuery.data ?? []

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const overBudget = budgets.filter((b) => b.spent > b.amount).length

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Presupuesto
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define límites de gasto por categoría y controla tu mes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav value={month} onChange={setMonth} />
          <BudgetDialog />
        </div>
      </section>

      {/* Summary row */}
      {!budgetsQuery.isLoading && budgets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Presupuesto total</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(totalBudget)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total gastado</p>
            <p className="mt-1 text-xl font-semibold text-destructive">
              {formatCurrency(totalSpent)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Restante</p>
            <p
              className={`mt-1 text-xl font-semibold ${
                totalBudget - totalSpent >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              }`}
            >
              {formatCurrency(Math.max(totalBudget - totalSpent, 0))}
            </p>
          </Card>
        </div>
      )}

      {overBudget > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="font-medium">
            {overBudget} categoría{overBudget !== 1 ? "s" : ""} sobrepasó el
            presupuesto este mes.
          </span>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {budgetsQuery.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="mt-1 h-4 w-32" />
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-40" />
                </CardContent>
              </Card>
            ))
          : budgets.map((budget) => {
              const usage =
                budget.amount > 0
                  ? Math.round((budget.spent / budget.amount) * 100)
                  : 0
              const remaining = Math.max(budget.amount - budget.spent, 0)
              const isOver = budget.spent > budget.amount

              return (
                <Card
                  key={budget.id}
                  className={
                    isOver ? "border-destructive/40 bg-destructive/5" : ""
                  }
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {budget.category.name}
                        </CardTitle>
                        {isOver && (
                          <Badge variant="destructive" className="text-xs">
                            Excedido
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-0.5">
                        Límite mensual
                      </CardDescription>
                    </div>
                    <BudgetDeleteButton budgetId={budget.id} />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-semibold">
                        {formatCurrency(budget.amount)}
                      </span>
                      <span className={`text-sm font-medium ${usageColor(usage)}`}>
                        {usage}% usado
                      </span>
                    </div>
                    <Progress
                      value={Math.min(usage, 100)}
                      className={progressColor(usage)}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Gastado: {formatCurrency(budget.spent)}</span>
                      <span>Restante: {formatCurrency(remaining)}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
      </section>

      {!budgetsQuery.isLoading && budgets.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PiggyBankIcon />
                </EmptyMedia>
                <EmptyTitle>Sin presupuestos aún</EmptyTitle>
                <EmptyDescription>
                  Crea tu primer presupuesto para controlar cuánto puedes gastar
                  por categoría.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <BudgetDialog />
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
