export type RecurringPaymentCategory = {
  id: string
  name: string
  color: string
  icon: string
}

export type RecurringPayment = {
  id: string
  amount: number
  description: string
  frequency: "monthly" | "custom_months" | "yearly"
  intervalMonths: number
  paymentKind: "fixed" | "variable"
  nextDueOn: string
  notes: string | null
  isActive: boolean
  type: "expense" | "income"
  category: RecurringPaymentCategory | null
  accountId: string | null
  account: { id: string; name: string; color: string } | null
  paidOn: string | null
  paidAmount: number | null
}
