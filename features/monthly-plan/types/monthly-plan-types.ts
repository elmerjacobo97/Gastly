export type SavingsMode = "percent" | "amount"

export type MonthlyPlan = {
  id: string
  month: string
  savingsMode: SavingsMode
  savingsValue: number
  notes: string | null
}
