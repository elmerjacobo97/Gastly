"use client"

import { format } from "date-fns"
import {
  AlertTriangleIcon,
  PiggyBankIcon,
  ReceiptIcon,
  TrendingDownIcon,
  WalletIcon,
  XCircleIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { CategoryIconBadge } from "@/components/category-icon-badge"
import { RowActionsMenu } from "@/components/row-actions-menu"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"
import { calculateSavings } from "@/features/monthly-plan/lib/monthly-plan-api"
import { deleteBudget } from "@/features/budget/server/actions"
import { formatCurrency } from "@/lib/format"
import { CreateBudgetDialog } from "@/features/budget/components/create-budget-dialog"
import { EditBudgetDialog } from "@/features/budget/components/edit-budget-dialog"
import { type Budget } from "@/features/budget/types/budget-types"
import { type Category } from "@/features/categories/types/category-types"
import { type MonthlyPlan } from "@/features/monthly-plan/types/monthly-plan-types"
import { type Transaction } from "@/features/transactions/types/transaction-types"
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

type BudgetPanelProps = {
  budgets: Budget[]
  plan: MonthlyPlan | null
  fixedExpenses: RecurringPayment[]
  transactions: Transaction[]
  categories: Category[]
  month: string
}

function BudgetAlerts({ budgets }: { budgets: Budget[] }) {
  const overList = budgets.filter((budget) => budget.spent > budget.amount)
  const nearList = budgets.filter((budget) => {
    const usage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
    return usage >= 80 && usage < 100
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
              : overList.map((budget) => budget.category.name).join(", ")}
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
                    (budget) =>
                      `${budget.category.name} (${Math.round((budget.spent / budget.amount) * 100)}%)`
                  )
                  .join(", ")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function BudgetCards({
  budgets,
  onEdit,
  onDelete,
}: {
  budgets: Budget[]
  onEdit: (budget: Budget) => void
  onDelete: (id: string) => void
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {budgets.map((budget) => {
        const usage = budget.amount > 0 ? Math.round((budget.spent / budget.amount) * 100) : 0
        const remaining = Math.max(budget.amount - budget.spent, 0)
        const isOver = budget.spent > budget.amount

        return (
          <Card key={budget.id} className={isOver ? "border-destructive/40 bg-destructive/5" : ""}>
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <CategoryIconBadge
                    icon={budget.category.icon}
                    color={budget.category.color}
                    className="size-7 rounded-md"
                  />
                  <CardTitle className="text-base">{budget.category.name}</CardTitle>
                  {isOver && <Badge variant="destructive" className="text-xs">Excedido</Badge>}
                </div>
                <CardDescription className="mt-0.5">Límite mensual</CardDescription>
              </div>
              <RowActionsMenu
                onEdit={() => onEdit(budget)}
                onDelete={() => onDelete(budget.id)}
                editLabel="Editar monto"
                className="size-8 text-muted-foreground"
              />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold tabular-nums">{formatCurrency(budget.amount)}</span>
                <span className={`text-sm font-medium ${usageColor(usage)}`}>{usage}% usado</span>
              </div>
              <Progress value={Math.min(usage, 100)} className={progressColor(usage)} />
              <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                <span>Gastado: {formatCurrency(budget.spent)}</span>
                <span>Restante: {formatCurrency(remaining)}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}

function BudgetPlanSummary({
  hasPlan,
  availableForBudget,
  unassigned,
  totalBudget,
  totalSpent,
}: {
  hasPlan: boolean
  availableForBudget: number
  unassigned: number
  totalBudget: number
  totalSpent: number
}) {
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
          <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${remaining >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
            <TrendingDownIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-muted-foreground">Restante</p>
          </div>
          <p className={`text-lg font-semibold tabular-nums ${remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
            {formatCurrency(Math.max(remaining, 0))}
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
  )
}

function BudgetEmptyState({ categories }: { categories: Category[] }) {
  return (
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
            <CreateBudgetDialog categories={categories} />
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  )
}

export function BudgetPanel({
  budgets,
  plan,
  fixedExpenses,
  transactions,
  categories,
  month: monthStr,
}: BudgetPanelProps) {
  const [editBudget, setEditBudget] = useState<Budget | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const month = useMemo(() => new Date(`${monthStr}-01T12:00:00`), [monthStr])

  const monthKey = format(month, "yyyy-MM")
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const actualIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const savings = calculateSavings(plan, actualIncome)
  const recurringEstimated = fixedExpenses
    .filter((expense) => isRelevantRecurringPayment(expense, monthKey))
    .reduce((sum, expense) => sum + (expense.paidAmount ?? expense.amount), 0)
  const availableForBudget = plan
    ? Math.max(actualIncome - savings - recurringEstimated, 0)
    : 0
  const unassigned = availableForBudget - totalBudget
  const hasPlanningData = !!plan

  function handleDelete() {
    if (!deleteId) return
    startTransition(async () => {
      try {
        await deleteBudget(deleteId)
        toast.success("Presupuesto eliminado")
        setDeleteId(null)
        router.refresh()
      } catch (error) {
        toast.error("No se pudo eliminar el presupuesto", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

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
          <MonthNav value={month} allowFuture />
          <CreateBudgetDialog categories={categories} />
        </div>
      </section>

      <BudgetPlanSummary
        hasPlan={hasPlanningData}
        availableForBudget={availableForBudget}
        unassigned={unassigned}
        totalBudget={totalBudget}
        totalSpent={totalSpent}
      />

      <BudgetAlerts budgets={budgets} />

      <BudgetCards
        budgets={budgets}
        onEdit={setEditBudget}
        onDelete={setDeleteId}
      />

      {budgets.length === 0 && <BudgetEmptyState categories={categories} />}

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
        pending={isPending}
        onConfirm={handleDelete}
      />
    </main>
  )
}
