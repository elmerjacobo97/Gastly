"use client";

import { differenceInMonths, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { TargetIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { ProgressCell } from "@/components/progress-cell";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { TableSearchInput } from "@/components/table-search-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddContributionDialog } from "@/features/savings/components/add-contribution-dialog";
import { CreateGoalDialog } from "@/features/savings/components/create-goal-dialog";
import { type SavingsGoal } from "@/features/savings/types/savings-types";
import { formatCurrency, formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/search";

type GoalFilter = "active" | "completed" | "all";

const FILTER_OPTIONS: { value: GoalFilter; label: string }[] = [
  { value: "active", label: "Activas" },
  { value: "completed", label: "Completadas" },
  { value: "all", label: "Todas" },
];

function estimatedCompletion(goal: SavingsGoal): string | null {
  if (goal.isCompleted || goal.currentAmount <= 0) return null;
  const monthsElapsed = Math.max(
    1,
    differenceInMonths(new Date(), parseISO(goal.createdAt)),
  );
  const monthlyRate = goal.currentAmount / monthsElapsed;
  if (monthlyRate <= 0) return null;
  const monthsLeft = Math.ceil(goal.remaining / monthlyRate);
  const estimatedDate = new Date();
  estimatedDate.setMonth(estimatedDate.getMonth() + monthsLeft);
  return format(estimatedDate, "MMM yyyy", { locale: es });
}

function monthlyNeeded(goal: SavingsGoal): number | null {
  if (goal.isCompleted || !goal.targetDate || goal.remaining <= 0) return null;
  const months = differenceInMonths(parseISO(goal.targetDate), new Date());
  if (months <= 0) return null;
  return Math.ceil(goal.remaining / months);
}

type GoalsSectionProps = {
  goals: SavingsGoal[];
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
};

export function GoalsSection({ goals, onEdit, onDelete }: GoalsSectionProps) {
  const [filter, setFilter] = useState<GoalFilter>("active");
  const [query, setQuery] = useState("");

  const activeCount = goals.filter((goal) => !goal.isCompleted).length;
  const completedCount = goals.length - activeCount;

  const visibleGoals = useMemo(
    () =>
      goals
        .filter((goal) => {
          if (filter === "active") return !goal.isCompleted;
          if (filter === "completed") return goal.isCompleted;
          return true;
        })
        .filter((goal) => matchesQuery(query, goal.name)),
    [filter, goals, query],
  );

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
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Metas</CardTitle>
        <CardDescription>
          {activeCount} activa{activeCount !== 1 ? "s" : ""} · {completedCount}{" "}
          completada{completedCount !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TableSearchInput value={query} onChange={setQuery} />
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={FILTER_OPTIONS}
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meta</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Fecha límite</TableHead>
                <TableHead>Ritmo</TableHead>
                <TableHead className="text-right">Ahorrado</TableHead>
                <TableHead className="sticky right-0 w-24 bg-card">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleGoals.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin resultados.
                  </TableCell>
                </TableRow>
              ) : (
                visibleGoals.map((goal) => {
                  const needed = monthlyNeeded(goal);
                  const estimated = estimatedCompletion(goal);

                  return (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: goal.color }}
                          />
                          <span
                            className="line-clamp-2 max-w-48 font-medium whitespace-normal break-words"
                            title={goal.name}
                          >
                            {goal.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ProgressCell
                          percent={goal.progress}
                          color={goal.color}
                        >
                          {goal.isCompleted
                            ? "Completada"
                            : `${goal.progress}% · Faltan ${formatCurrency(goal.remaining)}`}
                        </ProgressCell>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {goal.targetDate ? formatDate(goal.targetDate) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {needed || estimated ? (
                          <div className="flex flex-col">
                            {needed && (
                              <span>Ahorra {formatCurrency(needed)}/mes</span>
                            )}
                            {estimated && (
                              <span>Al ritmo actual: {estimated}</span>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="font-medium">
                          {formatCurrency(goal.currentAmount)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          de {formatCurrency(goal.targetAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="sticky right-0 bg-card shadow-[-8px_0_8px_-8px_rgb(0_0_0/0.15)] [tr:hover>&]:bg-muted">
                        <div className="flex items-center justify-end gap-1">
                          {!goal.isCompleted && (
                            <AddContributionDialog goal={goal} />
                          )}
                          <RowActionsMenu
                            onEdit={() => onEdit(goal)}
                            onDelete={() => onDelete(goal.id)}
                            className="text-muted-foreground data-[state=open]:bg-muted"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
