"use client"

import { format } from "date-fns"
import {
  AlertTriangleIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PiggyBankIcon,
  RefreshCwIcon,
  ReceiptIcon,
  Trash2Icon,
  TrendingDownIcon,
  WalletIcon,
  XCircleIcon,
} from "lucide-react"
import { useState } from "react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { CategoryIconBadge } from "@/features/categories/components/category-icon"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"
import { calculateSavings } from "@/features/monthly-plan/lib/monthly-plan-api"
import { formatCurrency } from "@/lib/format"
import { useBudgets } from "@/features/budget/hooks/queries"
import { useDeleteBudget } from "@/features/budget/hooks/mutations"
import { useMonthlyPlan } from "@/features/monthly-plan/hooks/queries"
import { useRecurringPayments } from "@/features/recurring-payments/hooks/queries"
import { useTransactions } from "@/features/transactions/hooks/queries"
import { CreateBudgetDialog } from "@/features/budget/components/create-budget-dialog"
import { EditBudgetDialog } from "@/features/budget/components/edit-budget-dialog"
import { type Budget } from "@/features/budget/types/budget-types"
import { MonthNav } from "@/components/month-nav"

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

function isRelevantRecurringPayment(payment: RecurringPayment, monthKey: string) {
  if (!payment.isActive) return false
  if (payment.frequency === "monthly") return true
  return payment.nextDueOn.startsWith(monthKey) || payment.paidOn?.startsWith(monthKey)
}

export function BudgetPanel() {
  const [month, setMonth] = useState(() => new Date())
  const [editBudget, setEditBudget] = useState<Budget | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const monthKey = format(month, "yyyy-MM")

  const budgetsQuery = useBudgets(month)
  const planQuery = useMonthlyPlan(month)
  const fixedExpensesQuery = useRecurringPayments(month, "expense")
  const transactionsQuery = useTransactions({ month })

  const deleteMutation = useDeleteBudget()

  const budgets = budgetsQuery.data ?? []
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const plan = planQuery.data ?? null
  const actualIncome = (transactionsQuery.data ?? [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const savings = calculateSavings(plan, actualIncome)
  const recurringEstimated = (fixedExpensesQuery.data ?? [])
    .filter((expense) => isRelevantRecurringPayment(expense, monthKey))
    .reduce((sum, expense) => sum + (expense.paidAmount ?? expense.amount), 0)
  const availableForBudget = plan
    ? Math.max(actualIncome - savings - recurringEstimated, 0)
    : 0
  const unassigned = availableForBudget - totalBudget
  const hasPlanningData = !!plan && !planQuery.isLoading && !fixedExpensesQuery.isLoading && !transactionsQuery.isLoading

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
          <MonthNav value={month} onChange={setMonth} allowFuture />
          <CreateBudgetDialog />
        </div>
      </section>

      {budgetsQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudieron cargar los presupuestos</AlertTitle>
          <AlertDescription>
            {budgetsQuery.error instanceof Error
              ? budgetsQuery.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => budgetsQuery.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {planQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudo cargar el plan mensual</AlertTitle>
          <AlertDescription>
            {planQuery.error instanceof Error
              ? planQuery.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => planQuery.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {fixedExpensesQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudieron cargar los pagos recurrentes</AlertTitle>
          <AlertDescription>
            {fixedExpensesQuery.error instanceof Error
              ? fixedExpensesQuery.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => fixedExpensesQuery.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {transactionsQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudieron cargar las transacciones</AlertTitle>
          <AlertDescription>
            {transactionsQuery.error instanceof Error
              ? transactionsQuery.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => transactionsQuery.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {planQuery.isLoading || fixedExpensesQuery.isLoading || transactionsQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>
      ) : hasPlanningData ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground">
                <WalletIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-muted-foreground">Disponible libre</p>
              </div>
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {formatCurrency(availableForBudget)}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
              <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${unassigned >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                <PiggyBankIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-muted-foreground">{unassigned >= 0 ? "Sin asignar" : "Sobreasignado"}</p>
              </div>
              <p className={`text-lg font-semibold tabular-nums ${unassigned >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {formatCurrency(Math.abs(unassigned))}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
                <ReceiptIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-muted-foreground">Total gastado</p>
              </div>
              <p className="text-lg font-semibold tabular-nums text-destructive">
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
              <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${totalBudget - totalSpent >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                <TrendingDownIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-muted-foreground">Restante</p>
              </div>
              <p className={`text-lg font-semibold tabular-nums ${totalBudget - totalSpent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {formatCurrency(Math.max(totalBudget - totalSpent, 0))}
              </p>
            </div>
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
      ) : !planQuery.isError && !fixedExpensesQuery.isError && !transactionsQuery.isError ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Crea tu plan mensual para saber cuánto puedes asignar a presupuestos.
        </div>
      ) : null}

      {!budgetsQuery.isLoading && (() => {
        const overList = budgets.filter((b) => b.spent > b.amount)
        const nearList = budgets.filter((b) => {
          const u = b.amount > 0 ? (b.spent / b.amount) * 100 : 0
          return u >= 80 && u < 100
        })
        if (overList.length === 0 && nearList.length === 0) return null
        return (
          <div className="flex flex-col gap-2">
            {overList.length > 0 && (
              <Alert variant="destructive">
                <XCircleIcon />
                <AlertTitle>
                  {overList.length === 1
                    ? `Presupuesto excedido en "${overList[0].category.name}"`
                    : `${overList.length} presupuestos excedidos`}
                </AlertTitle>
                <AlertDescription>
                  {overList.length === 1
                    ? `Gastaste ${formatCurrency(overList[0].spent)} de un límite de ${formatCurrency(overList[0].amount)}.`
                    : overList.map((b) => b.category.name).join(", ")}
                </AlertDescription>
              </Alert>
            )}
            {nearList.length > 0 && (
              <Alert variant="warning">
                <AlertTriangleIcon />
                <AlertTitle>
                  {nearList.length === 1
                    ? `Ya usaste ${Math.round((nearList[0].spent / nearList[0].amount) * 100)}% de "${nearList[0].category.name}"`
                    : `${nearList.length} categorías cerca del límite`}
                </AlertTitle>
                <AlertDescription>
                  {nearList.length === 1
                    ? `Quedan ${formatCurrency(nearList[0].amount - nearList[0].spent)} disponibles.`
                    : nearList
                        .map(
                          (b) =>
                            `${b.category.name} (${Math.round((b.spent / b.amount) * 100)}%)`
                        )
                        .join(", ")}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )
      })()}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {budgetsQuery.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-7 rounded-md" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="size-8 rounded-md" />
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-28" />
                  </div>
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
                  className={isOver ? "border-destructive/40 bg-destructive/5" : ""}
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CategoryIconBadge
                          icon={budget.category.icon}
                          color={budget.category.color}
                          className="size-7 rounded-md"
                        />
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                        >
                          <MoreHorizontalIcon />
                          <span className="sr-only">Acciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditBudget(budget)}>
                          <PencilIcon />
                          Editar monto
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setDeleteId(budget.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2Icon />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-semibold tabular-nums">
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
                    <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                      <span>Gastado: {formatCurrency(budget.spent)}</span>
                      <span>Restante: {formatCurrency(remaining)}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
      </section>

      {!budgetsQuery.isLoading && !budgetsQuery.isError && budgets.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PiggyBankIcon />
                </EmptyMedia>
                <EmptyTitle>Sin presupuestos aún</EmptyTitle>
                <EmptyDescription>
                  Crea tu primer presupuesto para controlar cuánto puedes gastar por categoría.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CreateBudgetDialog />
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      )}

      {editBudget && (
        <EditBudgetDialog
          budget={editBudget}
          open={!!editBudget}
          onOpenChange={(o) => !o && setEditBudget(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        description="Se eliminará este presupuesto permanentemente."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </main>
  )
}
