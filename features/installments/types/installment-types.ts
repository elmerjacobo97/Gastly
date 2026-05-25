export type InstallmentCategory = {
  id: string
  name: string
  color: string
  icon: string
}

export type InstallmentPayment = {
  id: string
  purchaseId: string
  paymentNumber: number
  dueOn: string
  amount: number
  transactionId: string | null
  paidExternally: boolean
}

export type InstallmentPurchase = {
  id: string
  description: string
  installmentAmount: number
  interestAmount: number
  totalInstallments: number
  firstPaymentOn: string
  notes: string | null
  category: InstallmentCategory | null
  accountId: string | null
  payments: InstallmentPayment[]
  paidCount: number
  pendingCount: number
  totalPaid: number
  totalPending: number
}
