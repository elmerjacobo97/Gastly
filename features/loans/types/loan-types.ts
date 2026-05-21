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
  amount: number
  expectedOn: string | null
  loanedOn: string
  notes: string | null
  payments: LoanPayment[]
  paidAmount: number
  pendingAmount: number
  isSettled: boolean
}
