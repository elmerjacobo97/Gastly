import { PiggyBankIcon, TargetIcon, TrendingUpIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Metas activas</CardTitle>
          <CardAction>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground">
              <TargetIcon className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {completed.length} completada{completed.length !== 1 ? "s" : ""}
          </p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{active.length}</p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Total ahorrado</CardTitle>
          <CardAction>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <PiggyBankIcon className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">de {formatCurrency(totalTarget)}</p>
          <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalSaved)}
          </p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Progreso global</CardTitle>
          <CardAction>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground">
              <TrendingUpIcon className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold tabular-nums text-foreground">{overallProgress}%</p>
          <Progress value={overallProgress} className="mt-1 h-1.5" />
        </CardContent>
      </Card>
    </div>
  )
}
