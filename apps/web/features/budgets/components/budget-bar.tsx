import { formatCurrency, type CurrencyCode } from "@/lib/format";
import { cn } from "@/lib/utils";

type BudgetState = { isOverBudget: boolean; isNearLimit: boolean };

export function budgetTone({ isOverBudget, isNearLimit }: BudgetState) {
  if (isOverBudget) {
    return { fill: "bg-destructive", text: "text-destructive" };
  }
  if (isNearLimit) {
    return {
      fill: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
    };
  }
  return { fill: "bg-primary", text: "text-foreground" };
}

type BudgetBarProps = BudgetState & {
  spentPercentage: number;
  totalPercentage: number;
  label: string;
  valueText: string;
  className?: string;
};

export function BudgetBar({
  spentPercentage,
  totalPercentage,
  label,
  valueText,
  className,
  ...state
}: BudgetBarProps) {
  const { fill } = budgetTone(state);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuetext={valueText}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={totalPercentage}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className={cn("absolute inset-y-0 left-0 opacity-35", fill)}
        style={{ width: `${totalPercentage}%` }}
      />
      <div
        className={cn("absolute inset-y-0 left-0 transition-all", fill)}
        style={{ width: `${spentPercentage}%` }}
      />
    </div>
  );
}

type BudgetLegendProps = BudgetState & {
  spent: number;
  committed: number;
  currency: CurrencyCode;
  className?: string;
};

export function BudgetLegend({
  spent,
  committed,
  currency,
  className,
  ...state
}: BudgetLegendProps) {
  const { fill } = budgetTone(state);

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className={cn("size-2 rounded-full", fill)} />
        <strong className="font-semibold text-foreground tabular-nums">
          {formatCurrency(spent, currency)}
        </strong>
        gastado
      </span>
      {committed > 0 && (
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn("size-2 rounded-full opacity-35", fill)}
          />
          <strong className="font-semibold text-foreground tabular-nums">
            {formatCurrency(committed, currency)}
          </strong>
          comprometido
        </span>
      )}
    </p>
  );
}
