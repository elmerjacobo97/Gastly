import { format, startOfMonth } from "date-fns"

import { type MonthlyPlan } from "@/features/monthly-plan/types/monthly-plan-types"
import { createClient } from "@/lib/supabase/server"

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

export async function getMonthlyPlan(month?: Date) {
  const supabase = await createClient()
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
