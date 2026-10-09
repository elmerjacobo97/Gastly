"use client";

import { type ReactNode, useMemo, useState } from "react";

import { CategoryIconBadge } from "@/components/category-icon-badge";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { StatusBadge } from "@/components/status-badge";
import { TableSearchInput } from "@/components/table-search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BudgetBar,
  BudgetLegend,
  budgetTone,
} from "@/features/budgets/components/budget-bar";
import { calculateBudgetProgress } from "@/features/budgets/lib/budget-calculations";
import { type CategoryBudget } from "@/features/budgets/types/budget-types";
import { formatCurrency, type CurrencyCode } from "@/lib/format";
import { matchesQuery } from "@/lib/search";
import { cn } from "@/lib/utils";

function BudgetStatusBadge({
  progress,
}: {
  progress: ReturnType<typeof calculateBudgetProgress>;
}) {
  if (progress.isOverBudget) {
    return <StatusBadge tone="danger">Excedido</StatusBadge>;
  }
  if (progress.isNearLimit) {
    return <StatusBadge tone="warning">Cerca del límite</StatusBadge>;
  }
  return <StatusBadge tone="muted">En rango</StatusBadge>;
}

type CategoryBudgetTableProps = {
  budgets: CategoryBudget[];
  currency: CurrencyCode;
  toolbarAction?: ReactNode;
  onEdit: (budget: CategoryBudget) => void;
  onDelete: (budget: CategoryBudget) => void;
};

export function CategoryBudgetTable({
  budgets,
  currency,
  toolbarAction,
  onEdit,
  onDelete,
}: CategoryBudgetTableProps) {
  const [query, setQuery] = useState("");

  const visibleBudgets = useMemo(
    () =>
      budgets.filter((budget) =>
        matchesQuery(query, budget.categoryName, budget.categoryDescription),
      ),
    [budgets, query],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <TableSearchInput value={query} onChange={setQuery} />
        {toolbarAction}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead className="min-w-56">Progreso</TableHead>
              <TableHead className="hidden text-right md:table-cell">
                Límite
              </TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead className="hidden lg:table-cell">Estado</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleBudgets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  Sin resultados.
                </TableCell>
              </TableRow>
            ) : (
              visibleBudgets.map((budget) => {
                const progress = calculateBudgetProgress(
                  budget.amount,
                  budget.spent,
                  budget.committed,
                );
                const tone = budgetTone(progress);

                return (
                  <TableRow key={budget.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <CategoryIconBadge
                          icon={budget.categoryIcon}
                          color={budget.categoryColor}
                          className="size-8 shrink-0 rounded-lg"
                        />
                        <div className="flex min-w-0 flex-col">
                          <span className="max-w-48 truncate font-medium">
                            {budget.categoryName}
                          </span>
                          {budget.categoryDescription && (
                            <span className="max-w-48 truncate text-xs text-muted-foreground">
                              {budget.categoryDescription}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <BudgetBar
                          label={`${budget.categoryName}: ${formatCurrency(budget.spent, currency)} gastados y ${formatCurrency(budget.committed, currency)} comprometidos de ${formatCurrency(budget.amount, currency)}`}
                          valueText={`${progress.percentage}% utilizado`}
                          spentPercentage={progress.spentBarPercentage}
                          totalPercentage={progress.barPercentage}
                          isOverBudget={progress.isOverBudget}
                          isNearLimit={progress.isNearLimit}
                          className="h-2"
                        />
                        <BudgetLegend
                          spent={budget.spent}
                          committed={budget.committed}
                          currency={currency}
                          isOverBudget={progress.isOverBudget}
                          isNearLimit={progress.isNearLimit}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                      {formatCurrency(budget.amount, currency)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        tone.text,
                      )}
                    >
                      {progress.isOverBudget ? "Excedido por " : "Quedan "}
                      {formatCurrency(Math.abs(progress.remaining), currency)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <BudgetStatusBadge progress={progress} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <RowActionsMenu
                          onEdit={() => onEdit(budget)}
                          onDelete={() => onDelete(budget)}
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
    </div>
  );
}
