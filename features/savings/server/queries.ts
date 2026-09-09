import { createClient } from "@/lib/supabase/server"
import { type SavingsGoal } from "@/features/savings/types/savings-types"

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
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("savings_goals")
    .select("id, name, target_amount, current_amount, target_date, color, notes, created_at")
    .order("created_at", { ascending: false })
    .overrideTypes<SavingsGoalRow[], { merge: false }>()
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapGoal)
}
