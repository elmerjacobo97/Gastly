"use client"

import {
  AlertTriangleIcon,
  XCircleIcon,
} from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { type Budget } from "@/features/budget/types/budget-types"
import { formatCurrency } from "@/lib/format"

export function BudgetAlerts({ budgets }: { budgets: Budget[] }) {
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
