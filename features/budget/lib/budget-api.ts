import { format, startOfMonth, endOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/browser";
import type { BudgetValues } from "@/features/budget/schemas/budget-schemas";
import type { Budget } from "@/features/budget/types/budget-types";

type BudgetRow = {
  id: string;
  amount: number | string;
  month: string;
  categories: {
    id: string;
    name: string;
    color: string;
  };
};

function mapBudget(row: BudgetRow & { spent?: number | string }): Budget {
  return {
    id: row.id,
    amount: Number(row.amount),
    month: row.month,
    category: {
      id: row.categories.id,
      name: row.categories.name,
      color: row.categories.color,
    },
    spent: Number(row.spent ?? 0),
  };
}

export async function getBudgets(month?: Date) {
  const supabase = createClient();
  const targetMonth = startOfMonth(month ?? new Date());
  const monthStr = format(targetMonth, "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(targetMonth), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("budgets")
    .select(
      `
      id,
      amount,
      month,
      categories!inner(id, name, color)
    `
    )
    .eq("month", monthStr)
    .returns<BudgetRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const budgets = data.map(mapBudget);

  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("type", "expense")
    .gte("occurred_on", monthStr)
    .lte("occurred_on", monthEnd);

  if (txError) {
    throw new Error(txError.message);
  }

  const spentByCategory = new Map<string, number>();
  for (const tx of transactions ?? []) {
    const current = spentByCategory.get(tx.category_id) ?? 0;
    spentByCategory.set(tx.category_id, current + Number(tx.amount));
  }

  return budgets.map((budget) => ({
    ...budget,
    spent: spentByCategory.get(budget.category.id) ?? 0,
  }));
}

export async function createBudget(values: BudgetValues) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Debes iniciar sesion para crear un presupuesto.");
  }

  const month = format(startOfMonth(values.month), "yyyy-MM-dd");

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      category_id: values.categoryId,
      amount: values.amount,
      month,
    },
    { onConflict: "user_id,category_id,month" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateBudget(id: string, amount: number) {
  const supabase = createClient();
  const { error } = await supabase.from("budgets").update({ amount }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBudget(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
