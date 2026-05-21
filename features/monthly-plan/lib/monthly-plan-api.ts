import { format, startOfMonth } from "date-fns"

import { type MonthlyPlanValues } from "@/features/monthly-plan/schemas/monthly-plan-schemas"
import { type MonthlyPlan } from "@/features/monthly-plan/types/monthly-plan-types"
import { createClient } from "@/lib/supabase/browser"

type MonthlyPlanRow = {
  id: string
  month: string
  expected_income: number | string
  savings_mode: "percent" | "amount"
  savings_value: number | string
  notes: string | null
  transactions?: { id: string }[] | null
}

function mapMonthlyPlan(row: MonthlyPlanRow): MonthlyPlan {
  return {
    id: row.id,
    month: row.month,
    expectedIncome: Number(row.expected_income),
    savingsMode: row.savings_mode,
    savingsValue: Number(row.savings_value),
    notes: row.notes,
    salaryTransactionId: row.transactions?.[0]?.id ?? null,
  }
}

function getMonthDate(month: Date) {
  return format(startOfMonth(month), "yyyy-MM-dd")
}

export function calculateSavings(plan: MonthlyPlan | null) {
  if (!plan) return 0
  if (plan.savingsMode === "percent") {
    return (plan.expectedIncome * plan.savingsValue) / 100
  }
  return Math.min(plan.savingsValue, plan.expectedIncome)
}

export async function getMonthlyPlan(month?: Date) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("monthly_plans")
    .select("id, month, expected_income, savings_mode, savings_value, notes, transactions(id)")
    .eq("month", getMonthDate(month ?? new Date()))
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? mapMonthlyPlan(data as MonthlyPlanRow) : null
}

export async function registerSalaryIncome(plan: MonthlyPlan) {
  if (plan.salaryTransactionId) {
    throw new Error("El sueldo de este plan ya fue registrado.")
  }

  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Debes iniciar sesion para registrar tu sueldo.")
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .upsert(
      {
        user_id: user.id,
        name: "Sueldo",
        type: "income",
        color: "emerald",
        icon: "salary",
      },
      { onConflict: "user_id,type,name" }
    )
    .select("id")
    .single()

  if (categoryError) {
    throw new Error(categoryError.message)
  }

  const occurredOn = new Date(`${plan.month}T12:00:00`)
  occurredOn.setDate(15)

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    category_id: category.id,
    monthly_plan_id: plan.id,
    type: "income",
    amount: plan.expectedIncome,
    description: "Sueldo",
    occurred_on: format(occurredOn, "yyyy-MM-dd"),
    notes: "Registrado desde plan mensual",
  })

  if (error) {
    if (error.code === "23505") {
      throw new Error("El sueldo de este plan ya fue registrado.")
    }
    throw new Error(error.message)
  }
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
        expected_income: values.expectedIncome,
        savings_mode: values.savingsMode,
        savings_value: values.savingsValue,
        notes: values.notes || null,
      },
      { onConflict: "user_id,month" }
    )
    .select("id, month, expected_income, savings_mode, savings_value, notes, transactions(id)")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapMonthlyPlan(data as MonthlyPlanRow)
}
