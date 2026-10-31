export type BudgetState = { isOverBudget: boolean; isNearLimit: boolean };

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
