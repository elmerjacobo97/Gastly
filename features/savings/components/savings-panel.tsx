"use client"

import { differenceInMonths, format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import {
  CheckCircle2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PiggyBankIcon,
  RefreshCwIcon,
  TargetIcon,
  Trash2Icon,
  TrendingUpIcon,
  AlertTriangleIcon,
} from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Card,
  CardContent,
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
import { AddContributionDialog } from "@/features/savings/components/add-contribution-dialog"
import { CreateGoalDialog } from "@/features/savings/components/create-goal-dialog"
import { EditGoalDialog } from "@/features/savings/components/edit-goal-dialog"
import { useSavingsGoals } from "@/features/savings/hooks/queries"
import { useDeleteSavingsGoal } from "@/features/savings/hooks/mutations"
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

function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: SavingsGoal
  onEdit: (g: SavingsGoal) => void
  onDelete: (id: string) => void
}) {
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                  <MoreHorizontalIcon />
                  <span className="sr-only">Acciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(goal)}>
                  <PencilIcon />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => onDelete(goal.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2Icon />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

function GoalSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="size-8 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="h-8 w-32" />
      </CardContent>
    </Card>
  )
}

export function SavingsPanel() {
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const query = useSavingsGoals()
  const deleteMutation = useDeleteSavingsGoal()

  const goals = query.data ?? []
  const active = goals.filter((g) => !g.isCompleted)
  const completed = goals.filter((g) => g.isCompleted)

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0)
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Metas de ahorro
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define objetivos y sigue tu progreso hacia ellos.
          </p>
        </div>
        <CreateGoalDialog />
      </section>

      {query.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudo cargar la información</AlertTitle>
          <AlertDescription>
            {query.error instanceof Error
              ? query.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {(query.isLoading || goals.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground">
              <TargetIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Metas activas</p>
              <p className="truncate text-xs text-muted-foreground">{completed.length} completada{completed.length !== 1 ? "s" : ""}</p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {query.isLoading ? <Skeleton className="h-6 w-12" /> : active.length}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <PiggyBankIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Total ahorrado</p>
              <p className="truncate text-xs text-muted-foreground">de {query.isLoading ? "—" : formatCurrency(totalTarget)}</p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {query.isLoading ? <Skeleton className="h-6 w-28" /> : formatCurrency(totalSaved)}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground">
              <TrendingUpIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Progreso global</p>
              {!query.isLoading && <Progress value={overallProgress} className="mt-1 h-1.5" />}
            </div>
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {query.isLoading ? <Skeleton className="h-6 w-16" /> : `${overallProgress}%`}
            </p>
          </div>
        </div>
      )}

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <GoalSkeleton key={i} />
          ))}
        </div>
      ) : active.length === 0 && completed.length === 0 && !query.isError ? (
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
      ) : (
        <>
          {active.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={setEditGoal}
                  onDelete={setDeleteId}
                />
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">Completadas</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={setEditGoal}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {editGoal && (
        <EditGoalDialog
          goal={editGoal}
          open={!!editGoal}
          onOpenChange={(o) => !o && setEditGoal(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        description="Se eliminará esta meta permanentemente junto con su progreso."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </main>
  )
}
