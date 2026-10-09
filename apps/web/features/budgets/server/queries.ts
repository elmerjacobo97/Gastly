import "server-only";

import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  aggregateBudgetExpenses,
  aggregatePendingPayments,
  categoryCurrencyKey,
  type BudgetExpense,
  type PendingPayment,
} from "@/features/budgets/lib/budget-calculations";
import {
  type BudgetOverview,
  type CategoryBudget,
  type MonthlyBudgetTotal,
} from "@/features/budgets/types/budget-types";
import { createClient } from "@/lib/supabase/server";
import { type CurrencyCode } from "@/lib/format";

const PAGE_SIZE = 1000;

type CategoryRow = {
  id: string;
  name: string;
  type: "expense";
  color: string;
  icon: string;
  description: string | null;
  created_at: string;
};

type CategoryBudgetRow = {
  id: string;
  category_id: string;
  amount: number | string;
  currency: CurrencyCode;
};

type MonthlyBudgetRow = {
  id: string;
  amount: number | string;
  currency: CurrencyCode;
};

type BudgetExpenseRow = {
  category_id: string | null;
  amount: number | string;
  currency: CurrencyCode;
};

type RecurringExpenseRow = {
  id: string;
  category_id: string | null;
  amount: number | string;
  currency: CurrencyCode;
  frequency: PendingPayment["frequency"];
  next_due_on: string;
};

type PaidRecurringRow = { recurring_expense_id: string | null };

type PendingInstallmentRow = {
  amount: number | string;
  installment_purchases: { category_id: string | null };
};

export async function getBudgetOverview(month: Date): Promise<BudgetOverview> {
  const supabase = await createClient();
  const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");

  const [categoryBudgetResult, monthlyBudgetResult, categoryResult] =
    await Promise.all([
      supabase
        .from("budgets")
        .select("id, category_id, amount, currency")
        .eq("month", monthStart)
        .order("created_at", { ascending: true })
        .overrideTypes<CategoryBudgetRow[], { merge: false }>(),
      supabase
        .from("monthly_budget_totals")
        .select("id, amount, currency")
        .eq("month", monthStart)
        .overrideTypes<MonthlyBudgetRow[], { merge: false }>(),
      supabase
        .from("categories")
        .select("id, name, type, color, icon, description, created_at")
        .eq("type", "expense")
        .order("name", { ascending: true })
        .overrideTypes<CategoryRow[], { merge: false }>(),
    ]);

  if (categoryBudgetResult.error) {
    throw new Error(categoryBudgetResult.error.message);
  }
  if (monthlyBudgetResult.error) {
    throw new Error(monthlyBudgetResult.error.message);
  }
  if (categoryResult.error) throw new Error(categoryResult.error.message);

  const expenseRows: BudgetExpenseRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("category_id, amount, currency, id")
      .eq("type", "expense")
      .gte("occurred_on", monthStart)
      .lte("occurred_on", monthEnd)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)
      .overrideTypes<BudgetExpenseRow[], { merge: false }>();

    if (error) throw new Error(error.message);
    expenseRows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const { data: recurringRows, error: recurringError } = await supabase
    .from("recurring_expenses")
    .select("id, category_id, amount, currency, frequency, next_due_on")
    .eq("type", "expense")
    .eq("is_active", true)
    .overrideTypes<RecurringExpenseRow[], { merge: false }>();
  if (recurringError) throw new Error(recurringError.message);

  const paidIds = new Set<string>();
  if (recurringRows.length > 0) {
    const { data: paidRows, error: paidError } = await supabase
      .from("transactions")
      .select("recurring_expense_id")
      .in(
        "recurring_expense_id",
        recurringRows.map((row) => row.id),
      )
      .gte("occurred_on", monthStart)
      .lte("occurred_on", monthEnd)
      .overrideTypes<PaidRecurringRow[], { merge: false }>();
    if (paidError) throw new Error(paidError.message);
    for (const row of paidRows) {
      if (row.recurring_expense_id) paidIds.add(row.recurring_expense_id);
    }
  }
  const { data: pendingInstallmentRows, error: pendingInstallmentError } =
    await supabase
      .from("installment_payments")
      .select("amount, installment_purchases!inner(category_id)")
      .gte("due_on", monthStart)
      .lte("due_on", monthEnd)
      .is("transaction_id", null)
      .eq("paid_externally", false)
      .overrideTypes<PendingInstallmentRow[], { merge: false }>();
  if (pendingInstallmentError) throw new Error(pendingInstallmentError.message);

  const pendingInstallments = pendingInstallmentRows.map(
    (row): BudgetExpense => ({
      categoryId: row.installment_purchases.category_id,
      amount: Number(row.amount),
      currency: "PEN",
    }),
  );
  const committed = aggregatePendingPayments(
    recurringRows.map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      amount: Number(row.amount),
      currency: row.currency,
      frequency: row.frequency,
      nextDueOn: row.next_due_on,
    })),
    paidIds,
    format(startOfMonth(month), "yyyy-MM"),
    pendingInstallments,
  );

  const categories = categoryResult.data.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    color: row.color,
    icon: row.icon,
    description: row.description ?? "",
    createdAt: row.created_at,
  }));
  const spending = aggregateBudgetExpenses(
    expenseRows.map((row): BudgetExpense => ({
      categoryId: row.category_id,
      amount: Number(row.amount),
      currency: row.currency,
    })),
  );
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const categoryBudgets: CategoryBudget[] = categoryBudgetResult.data.flatMap(
    (row) => {
      const category = categoryById.get(row.category_id);
      if (!category) return [];

      return [
        {
          id: row.id,
          categoryId: category.id,
          categoryName: category.name,
          categoryColor: category.color,
          categoryIcon: category.icon,
          categoryDescription: category.description,
          amount: Number(row.amount),
          currency: row.currency,
          spent:
            spending.categoryByCurrency[
              categoryCurrencyKey(category.id, row.currency)
            ] ?? 0,
          committed:
            committed.categoryByCurrency[
              categoryCurrencyKey(category.id, row.currency)
            ] ?? 0,
        },
      ];
    },
  );
  const monthlyBudgets: MonthlyBudgetTotal[] = monthlyBudgetResult.data.map(
    (row) => ({
      id: row.id,
      amount: Number(row.amount),
      currency: row.currency,
    }),
  );

  return {
    month: format(startOfMonth(month), "yyyy-MM"),
    categories,
    categoryBudgets,
    monthlyBudgets,
    spentByCurrency: spending.totalByCurrency,
    committedByCurrency: committed.totalByCurrency,
  };
}
