import { type CurrencyCode, type CurrencyTotals } from "@/lib/format";

export type BudgetExpense = {
  categoryId: string | null;
  amount: number;
  currency: CurrencyCode;
};

export type ExpenseSpending = {
  totalByCurrency: CurrencyTotals;
  categoryByCurrency: Record<string, number>;
};

export function categoryCurrencyKey(
  categoryId: string,
  currency: CurrencyCode,
) {
  return `${categoryId}:${currency}`;
}

export function aggregateBudgetExpenses(
  expenses: BudgetExpense[],
): ExpenseSpending {
  const totalByCurrency: CurrencyTotals = {};
  const categoryByCurrency: Record<string, number> = {};

  for (const expense of expenses) {
    totalByCurrency[expense.currency] =
      (totalByCurrency[expense.currency] ?? 0) + expense.amount;

    if (expense.categoryId) {
      const key = categoryCurrencyKey(expense.categoryId, expense.currency);
      categoryByCurrency[key] = (categoryByCurrency[key] ?? 0) + expense.amount;
    }
  }

  return { totalByCurrency, categoryByCurrency };
}

export type PendingPayment = {
  id: string;
  categoryId: string | null;
  amount: number;
  currency: CurrencyCode;
  frequency: "monthly" | "custom_months" | "yearly";
  nextDueOn: string;
};

export function aggregatePendingPayments(
  payments: PendingPayment[],
  paidIds: Set<string>,
  monthKey: string,
  pendingInstallments: BudgetExpense[] = [],
): ExpenseSpending {
  return aggregateBudgetExpenses([
    ...payments
      .filter(
        (payment) =>
          !paidIds.has(payment.id) &&
          (payment.frequency === "monthly" ||
            payment.nextDueOn.startsWith(monthKey)),
      )
      .map(({ categoryId, amount, currency }) => ({
        categoryId,
        amount,
        currency,
      })),
    ...pendingInstallments,
  ]);
}

export function calculateBudgetProgress(
  limit: number,
  spent: number,
  committed = 0,
) {
  const used = spent + committed;
  const rawPercentage = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const spentPercentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  return {
    remaining: limit - used,
    percentage: rawPercentage,
    spentPercentage,
    barPercentage: Math.min(100, rawPercentage),
    spentBarPercentage: Math.min(100, spentPercentage),
    isOverBudget: used > limit,
    isNearLimit: rawPercentage >= 80 && used <= limit,
  };
}
