export type GastlyConfig = {
  url: string
  publishableKey: string
}

export type GastlySession = {
  userId: string
  accessToken: string
  refreshToken: string
}

export type TransactionType = "expense" | "income"

export type TransactionRecord = {
  id: string
  type: TransactionType
  amount: number
  description: string
  occurredOn: string
  notes: string | null
  categoryName: string | null
  categoryType: TransactionType | null
  paymentMethod: string
  createdAt: string
}

export type CategoryRecord = {
  id: string
  name: string
  type: TransactionType
  color: string
  icon: string
}

export type AccountRecord = {
  id: string
  name: string
  currency: string
  balance: number
  color: string
  notes: string | null
}

export type LoanRecord = {
  id: string
  personName: string
  direction: "lent" | "borrowed"
  currency: string
  amount: number
  expectedOn: string | null
  loanedOn: string
  notes: string | null
  disbursements: { amount: number }[]
  payments: { amount: number }[]
}

export type LoanSummary = {
  id: string
  personName: string
  direction: "lent" | "borrowed"
  currency: string
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  isSettled: boolean
  expectedOn: string | null
}

export type InstallmentPurchaseRecord = {
  id: string
  description: string
  installmentAmount: number
  totalInstallments: number
  pendingCount: number
  totalPaid: number
  totalPending: number
}

export type CustodyOrderRecord = {
  id: string
  personName: string
  title: string
  status: string
  totalDeposited: number
  totalDisbursed: number
  balanceHeld: number
  isSettled: boolean
}

export type RecurringPaymentRecord = {
  id: string
  description: string
  amount: number
  frequency: string
  nextDueOn: string
  isActive: boolean
  type: TransactionType
  paidAmount: number | null
}

export type BudgetRecord = {
  id: string
  categoryName: string
  amount: number
  spent: number
  month: string
}

export type BalanceRecord = {
  accountId: string
  accountName: string
  currency: string
  balance: number
  color: string
}
