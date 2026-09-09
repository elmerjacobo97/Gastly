"use server"

import { revalidatePath } from "next/cache"
import { format, startOfMonth, subMonths } from "date-fns"

import { createClient } from "@/lib/supabase/server"
import { type MonthlyPlanValues } from "@/features/monthly-plan/schemas/monthly-plan-schemas"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Debes iniciar sesión para guardar el plan mensual.")
  }

  return { supabase, userId: user.id }
}

function revalidatePlan() {
  revalidatePath("/dashboard/monthly-plan")
  revalidatePath("/dashboard")
}

export async function upsertMonthlyPlan(values: MonthlyPlanValues): Promise<void> {
  const { supabase, userId } = await requireUser()

  const { error } = await supabase
    .from("monthly_plans")
    .upsert(
      {
        user_id: userId,
        month: format(startOfMonth(new Date(`${values.month}-01T12:00:00`)), "yyyy-MM-dd"),
        savings_mode: values.savingsMode,
        savings_value: values.savingsValue,
        notes: values.notes || null,
      },
      { onConflict: "user_id,month" }
    )

  if (error) {
    throw new Error(error.message)
  }

  revalidatePlan()
}

export async function getPrevMonthPlan(month: Date): Promise<MonthlyPlanValues | null> {
  const supabase = await createClient()
  const prevMonth = subMonths(startOfMonth(month), 1)

  const { data, error } = await supabase
    .from("monthly_plans")
    .select("id, month, savings_mode, savings_value, notes")
    .eq("month", format(startOfMonth(prevMonth), "yyyy-MM-dd"))
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) return null

  return {
    month: startOfMonth(month),
    savingsMode: data.savings_mode as "percent" | "amount",
    savingsValue: Number(data.savings_value),
    notes: data.notes ?? "",
  }
}
