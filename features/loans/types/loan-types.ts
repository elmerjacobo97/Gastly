export type LoanDirection = "lent" | "borrowed"
export type LoanCurrency = "PEN" | "USD" | "MXN"

export type LoanPayment = {
  id: string
  loanId: string
  amount: number
  occurredOn: string
  notes: string | null
}

export type Loan = {
  id: string
  personName: string
  direction: LoanDirection
  currency: LoanCurrency
  amount: number
  expectedOn: string | null
  loanedOn: string
  notes: string | null
  payments: LoanPayment[]
  paidAmount: number
  pendingAmount: number
  isSettled: boolean
}
