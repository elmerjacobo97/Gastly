import { differenceInMonths, format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import {
  CheckCircle2Icon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RowActionsMenu } from "@/components/row-actions-menu"
import { AddContributionDialog } from "@/features/savings/components/add-contribution-dialog"
import { type SavingsGoal } from "@/features/savings/types/savings-types"
import { formatCurrency, formatDate } from "@/lib/format"

function estimatedCompletion(goal: SavingsGoal): string | null {
  if (goal.isCompleted || goal.currentAmount <= 0) return null
  const monthsElapsed = Math.max(
    1,
    differenceInMonths(new Date(), parseISO(goal.createdAt))
  )
  const monthlyRate = goal.currentAmount / monthsElapsed
  if (monthlyRate <= 0) return null
  const monthsLeft = Math.ceil(goal.remaining / monthlyRate)
  const estimatedDate = new Date()
  estimatedDate.setMonth(estimatedDate.getMonth() + monthsLeft)
  return format(estimatedDate, "MMM yyyy", { locale: es })
}

function monthlyNeeded(goal: SavingsGoal): number | null {
  if (goal.isCompleted || !goal.targetDate || goal.remaining <= 0) return null
  const months = differenceInMonths(parseISO(goal.targetDate), new Date())
  if (months <= 0) return null
  return Math.ceil(goal.remaining / months)
}

type GoalCardProps = {
  goal: SavingsGoal
  onEdit: (goal: SavingsGoal) => void
  onDelete: (id: string) => void
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const estimated = estimatedCompletion(goal)
  const needed = monthlyNeeded(goal)

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: goal.color }}
            />
            <CardTitle className="text-base truncate">{goal.name}</CardTitle>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {goal.isCompleted && (
              <Badge variant="secondary" className="gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2Icon className="size-3" />
                Completada
              </Badge>
            )}
            <RowActionsMenu
              onEdit={() => onEdit(goal)}
              onDelete={() => onDelete(goal.id)}
              className="text-muted-foreground"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold tabular-nums">
              {formatCurrency(goal.currentAmount)}
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">
              de {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <Progress
            value={goal.progress}
            className="h-2"
            style={{ "--progress-color": goal.color } as React.CSSProperties}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{goal.progress}% completado</span>
            {!goal.isCompleted && (
              <span>Faltan {formatCurrency(goal.remaining)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {goal.targetDate && (
            <span>Fecha límite: {formatDate(goal.targetDate)}</span>
          )}
          {needed && (
            <span className="text-primary font-medium">
              Ahorra {formatCurrency(needed)}/mes para llegar a tiempo
            </span>
          )}
          {estimated && (
            <span>Al ritmo actual llegarás en {estimated}</span>
          )}
        </div>

        <div className="mt-auto pt-1">
          <AddContributionDialog goal={goal} />
        </div>
      </CardContent>
    </Card>
  )
}
