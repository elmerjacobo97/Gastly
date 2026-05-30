export type Account = {
  id: string
  name: string
  balance: number
  color: string
  notes: string | null
  createdAt: string
}

export type AccountTransfer = {
  id: string
  fromAccountId: string
  fromAccountName: string
  toAccountId: string
  toAccountName: string
  amount: number
  occurredOn: string
  notes: string | null
}
