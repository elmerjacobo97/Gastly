import { createClient } from "@/lib/supabase/server"
import { type Account, type AccountTransfer } from "@/features/accounts/types/account-types"

type AccountRow = {
  id: string
  name: string
  balance: string | number
  color: string
  notes: string | null
  created_at: string
}

type TransferRow = {
  id: string
  from_account_id: string
  to_account_id: string
  amount: string | number
  occurred_on: string
  notes: string | null
  from_account: { name: string } | null
  to_account: { name: string } | null
}

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    balance: Number(row.balance),
    color: row.color,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

function mapTransfer(row: TransferRow): AccountTransfer {
  return {
    id: row.id,
    fromAccountId: row.from_account_id,
    fromAccountName: row.from_account?.name ?? "",
    toAccountId: row.to_account_id,
    toAccountName: row.to_account?.name ?? "",
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
    notes: row.notes,
  }
}

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, balance, color, notes, created_at")
    .order("created_at", { ascending: true })
    .overrideTypes<AccountRow[], { merge: false }>()
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapAccount)
}

export async function getAccountTransfers(): Promise<AccountTransfer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("account_transfers")
    .select(`
      id, from_account_id, to_account_id, amount, occurred_on, notes,
      from_account:accounts!from_account_id(name),
      to_account:accounts!to_account_id(name)
    `)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .overrideTypes<TransferRow[], { merge: false }>()
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapTransfer)
}
