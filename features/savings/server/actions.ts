"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  type ContributionValues,
  type SavingsGoalValues,
} from "@/features/savings/schemas/savings-schemas"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error("Debes iniciar sesión.")

  return { supabase, userId: user.id }
}

function revalidateSavings() {
  revalidatePath("/dashboard/savings")
}

export async function createSavingsGoal(values: SavingsGoalValues): Promise<string> {
  const { supabase, userId } = await requireUser()

  const { data, error } = await supabase
    .from("savings_goals")
    .insert({
      user_id: userId,
      name: values.name,
      target_amount: values.targetAmount,
      target_date: values.targetDate || null,
      color: values.color,
      notes: values.notes || null,
    })
    .select("id")
    .single()
  if (error) throw new Error(error.message)
  revalidateSavings()
  return data.id
}

export async function updateSavingsGoal(id: string, values: SavingsGoalValues): Promise<void> {
  const { supabase } = await requireUser()

  const { error } = await supabase
    .from("savings_goals")
    .update({
      name: values.name,
      target_amount: values.targetAmount,
      target_date: values.targetDate || null,
      color: values.color,
      notes: values.notes || null,
    })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidateSavings()
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const { supabase } = await requireUser()

  const { error } = await supabase.from("savings_goals").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidateSavings()
}

export async function addContribution(goalId: string, values: ContributionValues): Promise<void> {
  const { supabase } = await requireUser()

  const { data: goal, error: fetchError } = await supabase
    .from("savings_goals")
    .select("current_amount")
    .eq("id", goalId)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  const newTotal = Number(goal.current_amount) + values.amount
  const { error } = await supabase
    .from("savings_goals")
    .update({ current_amount: newTotal })
    .eq("id", goalId)

  if (error) throw new Error(error.message)
  revalidateSavings()
}
