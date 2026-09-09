"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CategoryIconBadge } from "@/components/category-icon-badge"
import { RowActionsMenu } from "@/components/row-actions-menu"
import { type Budget } from "@/features/budget/types/budget-types"
import { formatCurrency } from "@/lib/format"

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

type BudgetCardProps = {
  budget: Budget
  onEdit: (budget: Budget) => void
  onDelete: (id: string) => void
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const usage = budget.amount > 0 ? Math.round((budget.spent / budget.amount) * 100) : 0
  const remaining = Math.max(budget.amount - budget.spent, 0)
  const isOver = budget.spent > budget.amount

  return (
    <Card className={isOver ? "border-destructive/40 bg-destructive/5" : ""}>
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
}

type BudgetCardsProps = {
  budgets: Budget[]
  onEdit: (budget: Budget) => void
  onDelete: (id: string) => void
}

export function BudgetCards({ budgets, onEdit, onDelete }: BudgetCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {budgets.map((budget) => (
        <BudgetCard key={budget.id} budget={budget} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </section>
  )
}
