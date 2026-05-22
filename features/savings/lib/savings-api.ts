import { createClient } from "@/lib/supabase/browser"
import { type SavingsGoal } from "@/features/savings/types/savings-types"
import { type SavingsGoalValues, type ContributionValues } from "@/features/savings/schemas/savings-schemas"

type SavingsGoalRow = {
  id: string
  name: string
  target_amount: number | string
  current_amount: number | string
  target_date: string | null
  color: string
  notes: string | null
  created_at: string
}

function mapGoal(row: SavingsGoalRow): SavingsGoal {
  const targetAmount = Number(row.target_amount)
  const currentAmount = Number(row.current_amount)
  const progress = targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0
  const remaining = Math.max(0, targetAmount - currentAmount)
  return {
    id: row.id,
    name: row.name,
    targetAmount,
    currentAmount,
    targetDate: row.target_date,
    color: row.color,
    notes: row.notes,
    createdAt: row.created_at,
    progress,
    remaining,
    isCompleted: currentAmount >= targetAmount,
  }
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("savings_goals")
    .select("id, name, target_amount, current_amount, target_date, color, notes, created_at")
    .order("created_at", { ascending: false })
    .returns<SavingsGoalRow[]>()
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapGoal)
}

export async function createSavingsGoal(values: SavingsGoalValues): Promise<void> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  const { error } = await supabase.from("savings_goals").insert({
    user_id: user.id,
    name: values.name,
    target_amount: values.targetAmount,
    target_date: values.targetDate || null,
    color: values.color,
    notes: values.notes || null,
  })
  if (error) throw new Error(error.message)
}

export async function updateSavingsGoal(id: string, values: SavingsGoalValues): Promise<void> {
  const supabase = createClient()
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
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("savings_goals").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function addContribution(goal: SavingsGoal, values: ContributionValues): Promise<void> {
  const supabase = createClient()
  const newTotal = goal.currentAmount + values.amount
  const { error } = await supabase
    .from("savings_goals")
    .update({ current_amount: newTotal })
    .eq("id", goal.id)
  if (error) throw new Error(error.message)
}
