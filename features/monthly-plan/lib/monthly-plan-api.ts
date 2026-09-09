import { type MonthlyPlan } from "@/features/monthly-plan/types/monthly-plan-types"

export function calculateSavings(plan: MonthlyPlan | null, actualIncome: number): number {
  if (!plan) return 0
  if (plan.savingsMode === "percent") {
    return Math.round((actualIncome * plan.savingsValue) / 100 * 100) / 100
  }
  return plan.savingsValue
}
