"use client";

import { CategoryIconBadge } from "@/components/category-icon-badge";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import {
  BudgetBar,
  BudgetLegend,
  budgetTone,
} from "@/features/budgets/components/budget-bar";
import { calculateBudgetProgress } from "@/features/budgets/lib/budget-calculations";
import { type CategoryBudget } from "@/features/budgets/types/budget-types";
import { formatCurrency, type CurrencyCode } from "@/lib/format";
import { cn } from "@/lib/utils";

type CategoryBudgetRowProps = {
  budget: CategoryBudget;
  currency: CurrencyCode;
  onEdit: (budget: CategoryBudget) => void;
  onDelete: (budget: CategoryBudget) => void;
};

function statusBadge(isOverBudget: boolean, isNearLimit: boolean) {
  if (isOverBudget) {
    return {
      label: "Excedido",
      className: "bg-destructive/10 text-destructive",
    };
  }
  if (isNearLimit) {
    return {
      label: "Cerca del límite",
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    };
  }
  return { label: "En rango", className: "" };
}

export function CategoryBudgetRow({
  budget,
  currency,
  onEdit,
  onDelete,
}: CategoryBudgetRowProps) {
  const progress = calculateBudgetProgress(
    budget.amount,
    budget.spent,
    budget.committed,
  );
  const tone = budgetTone(progress);
  const status = statusBadge(progress.isOverBudget, progress.isNearLimit);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-3 px-4 py-4">
      <CategoryIconBadge
        icon={budget.categoryIcon}
        color={budget.categoryColor}
        className="size-9 shrink-0 rounded-lg"
      />
      <div className="min-w-[12rem] flex-1">
        <p className="truncate text-sm font-medium">{budget.categoryName}</p>
        {budget.categoryDescription && (
          <p className="truncate text-xs text-muted-foreground">
            {budget.categoryDescription}
          </p>
        )}
        <BudgetBar
          label={`${budget.categoryName}: ${formatCurrency(budget.spent, currency)} gastados y ${formatCurrency(budget.committed, currency)} comprometidos de ${formatCurrency(budget.amount, currency)}`}
          valueText={`${progress.percentage}% utilizado`}
          spentPercentage={progress.spentBarPercentage}
          totalPercentage={progress.barPercentage}
          isOverBudget={progress.isOverBudget}
          isNearLimit={progress.isNearLimit}
          className="mt-2.5 h-2"
        />
        <BudgetLegend
          className="mt-1.5"
          spent={budget.spent}
          committed={budget.committed}
          currency={currency}
          isOverBudget={progress.isOverBudget}
          isNearLimit={progress.isNearLimit}
        />
      </div>
      <div className="ml-auto shrink-0 text-right">
        <p className={cn("text-sm font-semibold tabular-nums", tone.text)}>
          {progress.isOverBudget
            ? `Excedido por ${formatCurrency(Math.abs(progress.remaining), currency)}`
            : `Quedan ${formatCurrency(progress.remaining, currency)}`}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          Límite {formatCurrency(budget.amount, currency)}
        </p>
      </div>
      <Badge
        variant="secondary"
        className={cn("hidden shrink-0 lg:inline-flex", status.className)}
      >
        {status.label}
      </Badge>
      <RowActionsMenu
        className="shrink-0 text-muted-foreground"
        onEdit={() => onEdit(budget)}
        onDelete={() => onDelete(budget)}
      />
    </div>
  );
}
