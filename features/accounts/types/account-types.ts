export type AccountCurrency = "PEN" | "USD" | "MXN"

export type Account = {
  id: string
  name: string
  currency: AccountCurrency
  balance: number
  color: string
  notes: string | null
  createdAt: string
}

export type AccountTransfer = {
  id: string
  fromAccountId: string
  fromAccountName: string
  fromCurrency: AccountCurrency
  toAccountId: string
  toAccountName: string
  toCurrency: AccountCurrency
  fromAmount: number
  toAmount: number
  occurredOn: string
  notes: string | null
}
