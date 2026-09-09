export type LoanDirection = "lent" | "borrowed"

export const LOAN_CURRENCIES = ["PEN", "USD", "MXN"] as const

export type LoanCurrency = (typeof LOAN_CURRENCIES)[number]

export const LOAN_CURRENCY_LABELS: Record<LoanCurrency, string> = {
  PEN: "Soles (PEN)",
  USD: "Dólares (USD)",
  MXN: "Pesos (MXN)",
}

export type LoanPayment = {
  id: string
  loanId: string
  amount: number
  occurredOn: string
  notes: string | null
}

export type LoanDisbursement = {
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
  disbursements: LoanDisbursement[]
  payments: LoanPayment[]
  paidAmount: number
  pendingAmount: number
  isSettled: boolean
}

export type LoanPersonGroup = {
  key: string
  personName: string
  direction: LoanDirection
  balances: Loan[]
  isSettled: boolean
}

export type LoanHistoryKind = "disbursement" | "payment"

export type LoanHistoryEntry = {
  id: string
  kind: LoanHistoryKind
  loanId: string
  currency: LoanCurrency
  amount: number
  occurredOn: string
  notes: string | null
}
