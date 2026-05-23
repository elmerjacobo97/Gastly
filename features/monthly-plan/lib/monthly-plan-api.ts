import { format, startOfMonth } from "date-fns"

import { type MonthlyPlanValues } from "@/features/monthly-plan/schemas/monthly-plan-schemas"
import { type MonthlyPlan } from "@/features/monthly-plan/types/monthly-plan-types"
import { createClient } from "@/lib/supabase/browser"

type MonthlyPlanRow = {
  id: string
  month: string
  savings_mode: "percent" | "amount"
  savings_value: number | string
  notes: string | null
}

function mapMonthlyPlan(row: MonthlyPlanRow): MonthlyPlan {
  return {
    id: row.id,
    month: row.month,
    savingsMode: row.savings_mode,
    savingsValue: Number(row.savings_value),
    notes: row.notes,
  }
}

function getMonthDate(month: Date) {
  return format(startOfMonth(month), "yyyy-MM-dd")
}

export function calculateSavings(plan: MonthlyPlan | null, actualIncome: number): number {
  if (!plan) return 0
  if (plan.savingsMode === "percent") {
    return Math.round((actualIncome * plan.savingsValue) / 100 * 100) / 100
  }
  return plan.savingsValue
}

export async function getMonthlyPlan(month?: Date) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("monthly_plans")
    .select("id, month, savings_mode, savings_value, notes")
    .eq("month", getMonthDate(month ?? new Date()))
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? mapMonthlyPlan(data as MonthlyPlanRow) : null
}

export async function upsertMonthlyPlan(values: MonthlyPlanValues): Promise<MonthlyPlan> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Debes iniciar sesion para guardar el plan mensual.")
  }

  const { data, error } = await supabase
    .from("monthly_plans")
    .upsert(
      {
        user_id: user.id,
        month: getMonthDate(values.month),
        savings_mode: values.savingsMode,
        savings_value: values.savingsValue,
        notes: values.notes || null,
      },
      { onConflict: "user_id,month" }
    )
    .select("id, month, savings_mode, savings_value, notes")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapMonthlyPlan(data as MonthlyPlanRow)
}
