import { PiggyBankIcon, TargetIcon, TrendingUpIcon } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { type SavingsGoal } from "@/features/savings/types/savings-types"
import { formatCurrency } from "@/lib/format"

export function SummaryCards({ goals }: { goals: SavingsGoal[] }) {
  const active = goals.filter((g) => !g.isCompleted)
  const completed = goals.filter((g) => g.isCompleted)

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0)
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground">
          <TargetIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Metas activas</p>
          <p className="truncate text-xs text-muted-foreground">
            {completed.length} completada{completed.length !== 1 ? "s" : ""}
          </p>
        </div>
        <p className="text-lg font-semibold tabular-nums text-foreground">{active.length}</p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <PiggyBankIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Total ahorrado</p>
          <p className="truncate text-xs text-muted-foreground">de {formatCurrency(totalTarget)}</p>
        </div>
        <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
          {formatCurrency(totalSaved)}
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground">
          <TrendingUpIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Progreso global</p>
          <Progress value={overallProgress} className="mt-1 h-1.5" />
        </div>
        <p className="text-lg font-semibold tabular-nums text-foreground">{overallProgress}%</p>
      </div>
    </div>
  )
}
