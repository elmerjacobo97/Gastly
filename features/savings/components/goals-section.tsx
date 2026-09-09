import { TargetIcon } from "lucide-react"

import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { GoalCard } from "@/features/savings/components/goal-card"
import { CreateGoalDialog } from "@/features/savings/components/create-goal-dialog"
import { type SavingsGoal } from "@/features/savings/types/savings-types"

type GoalsSectionProps = {
  goals: SavingsGoal[]
  onEdit: (goal: SavingsGoal) => void
  onDelete: (id: string) => void
}

export function GoalsSection({ goals, onEdit, onDelete }: GoalsSectionProps) {
  const active = goals.filter((g) => !g.isCompleted)
  const completed = goals.filter((g) => g.isCompleted)

  if (goals.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TargetIcon />
          </EmptyMedia>
          <EmptyTitle>Sin metas de ahorro</EmptyTitle>
          <EmptyDescription>
            Crea tu primera meta para empezar a trackear tu progreso.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateGoalDialog />
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <>
      {active.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Completadas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
