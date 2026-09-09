"use server"

import { format, startOfMonth } from "date-fns"
import { revalidatePath } from "next/cache"

import { type BudgetValues } from "@/features/budget/schemas/budget-schemas"
import { createClient } from "@/lib/supabase/server"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) throw new Error("Debes iniciar sesión.")
  return { supabase, userId: user.id }
}

function revalidateBudget() {
  revalidatePath("/dashboard/budget")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/reports")
}

export async function createBudget(values: BudgetValues) {
  const { supabase, userId } = await requireUser()
  const month = format(startOfMonth(values.month), "yyyy-MM-dd")

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: userId,
      category_id: values.categoryId,
      amount: values.amount,
      month,
    },
    { onConflict: "user_id,category_id,month" }
  )

  if (error) throw new Error(error.message)
  revalidateBudget()
}

export async function updateBudget(id: string, amount: number) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("budgets").update({ amount }).eq("id", id)

  if (error) throw new Error(error.message)
  revalidateBudget()
}

export async function deleteBudget(id: string) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("budgets").delete().eq("id", id)

  if (error) throw new Error(error.message)
  revalidateBudget()
}
