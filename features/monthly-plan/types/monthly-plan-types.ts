export type SavingsMode = "percent" | "amount"

export type MonthlyPlan = {
  id: string
  month: string
  expectedIncome: number
  savingsMode: SavingsMode
  savingsValue: number
  notes: string | null
}
