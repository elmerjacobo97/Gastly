"use client"

import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { MonthNav } from "@/components/month-nav"
import { BudgetAlerts } from "@/features/budget/components/budget-alerts"
import { BudgetCards } from "@/features/budget/components/budget-cards"
import { BudgetEmptyState } from "@/features/budget/components/budget-empty-state"
import { BudgetPlanSummary } from "@/features/budget/components/budget-plan-summary"
import { CreateBudgetDialog } from "@/features/budget/components/create-budget-dialog"
import { EditBudgetDialog } from "@/features/budget/components/edit-budget-dialog"
import { deleteBudget } from "@/features/budget/server/actions"
import { type Budget } from "@/features/budget/types/budget-types"
import { type Category } from "@/features/categories/types/category-types"
import { calculateSavings } from "@/features/monthly-plan/lib/monthly-plan-api"
import { type MonthlyPlan } from "@/features/monthly-plan/types/monthly-plan-types"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"
import { type Transaction } from "@/features/transactions/types/transaction-types"

type BudgetPanelProps = {
  budgets: Budget[]
  plan: MonthlyPlan | null
  fixedExpenses: RecurringPayment[]
  transactions: Transaction[]
  categories: Category[]
  month: string
}

function isRelevantRecurringPayment(payment: RecurringPayment, monthKey: string) {
  if (!payment.isActive) return false
  if (payment.frequency === "monthly") return true
  return payment.nextDueOn.startsWith(monthKey) || payment.paidOn?.startsWith(monthKey)
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
        hasPlan={Boolean(plan)}
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
