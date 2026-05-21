export type FixedExpenseCategory = {
  id: string
  name: string
  color: string
}

export type FixedExpense = {
  id: string
  amount: number
  description: string
  frequency: "monthly" | "yearly"
  paymentKind: "fixed" | "variable"
  nextDueOn: string
  notes: string | null
  isActive: boolean
  category: FixedExpenseCategory | null
  paidOn: string | null
  paidAmount: number | null
}
