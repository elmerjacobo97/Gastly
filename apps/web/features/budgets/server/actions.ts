"use server";

import { revalidatePath } from "next/cache";

import {
  budgetIdSchema,
  categoryBudgetSchema,
  monthlyBudgetTotalSchema,
  type CategoryBudgetValues,
  type MonthlyBudgetTotalValues,
} from "@/features/budgets/schemas/budget-schemas";
import { createClient } from "@/lib/supabase/server";
import { parseOrThrow } from "@/lib/validation";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Debes iniciar sesión para gestionar presupuestos.");
  }

  return { supabase, userId: user.id };
}

function revalidateBudgets() {
  revalidatePath("/budgets");
}

export async function saveCategoryBudget(rawValues: CategoryBudgetValues) {
  const values = parseOrThrow(categoryBudgetSchema, rawValues);
  const { supabase, userId } = await requireUser();
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", values.categoryId)
    .eq("type", "expense")
    .maybeSingle();

  if (categoryError) throw new Error(categoryError.message);
  if (!category) throw new Error("Selecciona una categoría de gasto válida.");

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: userId,
      category_id: values.categoryId,
      month: `${values.month}-01`,
      currency: values.currency,
      amount: values.amount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,category_id,month,currency" },
  );

  if (error) throw new Error(error.message);
  revalidateBudgets();
}

export async function saveMonthlyBudgetTotal(
  rawValues: MonthlyBudgetTotalValues,
) {
  const values = parseOrThrow(monthlyBudgetTotalSchema, rawValues);
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("monthly_budget_totals").upsert(
    {
      user_id: userId,
      month: `${values.month}-01`,
      currency: values.currency,
      amount: values.amount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,month,currency" },
  );

  if (error) throw new Error(error.message);
  revalidateBudgets();
}

export async function deleteCategoryBudget(rawId: string) {
  const id = parseOrThrow(budgetIdSchema, rawId);
  const { supabase } = await requireUser();
  const { error } = await supabase.from("budgets").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateBudgets();
}

export async function deleteMonthlyBudgetTotal(rawId: string) {
  const id = parseOrThrow(budgetIdSchema, rawId);
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("monthly_budget_totals")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateBudgets();
}
