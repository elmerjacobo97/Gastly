import { createClient } from "@/lib/supabase/browser"
import { type Account, type AccountTransfer, type AccountCurrency } from "@/features/accounts/types/account-types"
import { type AccountValues, type TransferValues } from "@/features/accounts/schemas/account-schemas"

type AccountRow = {
  id: string
  name: string
  currency: AccountCurrency
  balance: string | number
  color: string
  notes: string | null
  created_at: string
}

type TransferRow = {
  id: string
  from_account_id: string
  to_account_id: string
  from_amount: string | number
  to_amount: string | number
  occurred_on: string
  notes: string | null
  from_account: { name: string; currency: AccountCurrency } | null
  to_account: { name: string; currency: AccountCurrency } | null
}

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
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
    fromCurrency: row.from_account?.currency ?? "PEN",
    toAccountId: row.to_account_id,
    toAccountName: row.to_account?.name ?? "",
    toCurrency: row.to_account?.currency ?? "PEN",
    fromAmount: Number(row.from_amount),
    toAmount: Number(row.to_amount),
    occurredOn: row.occurred_on,
    notes: row.notes,
  }
}

export async function getAccounts(): Promise<Account[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, currency, balance, color, notes, created_at")
    .order("created_at", { ascending: true })
    .returns<AccountRow[]>()
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapAccount)
}

export async function createAccount(values: AccountValues): Promise<Account> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      name: values.name,
      currency: values.currency,
      balance: values.balance,
      color: values.color,
      notes: values.notes || null,
    })
    .select("id, name, currency, balance, color, notes, created_at")
    .single()
  if (error) throw new Error(error.message)
  return mapAccount(data as AccountRow)
}

export async function updateAccount(id: string, values: AccountValues): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("accounts")
    .update({
      name: values.name,
      currency: values.currency,
      balance: values.balance,
      color: values.color,
      notes: values.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deleteAccount(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("accounts").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function getAccountTransfers(accountId?: string): Promise<AccountTransfer[]> {
  const supabase = createClient()
  let query = supabase
    .from("account_transfers")
    .select(`
      id, from_account_id, to_account_id, from_amount, to_amount, occurred_on, notes,
      from_account:accounts!from_account_id(name, currency),
      to_account:accounts!to_account_id(name, currency)
    `)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })

  if (accountId) {
    query = query.or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
  }

  const { data, error } = await query.returns<TransferRow[]>()
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapTransfer)
}

export async function createTransfer(values: TransferValues): Promise<void> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  const { error } = await supabase
    .from("account_transfers")
    .insert({
      user_id: user.id,
      from_account_id: values.fromAccountId,
      to_account_id: values.toAccountId,
      from_amount: values.fromAmount,
      to_amount: values.toAmount,
      occurred_on: values.occurredOn,
      notes: values.notes || null,
    })
  if (error) throw new Error(error.message)

  // Update balances
  const fromAccount = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", values.fromAccountId)
    .single()
  const toAccount = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", values.toAccountId)
    .single()

  if (fromAccount.data) {
    await supabase
      .from("accounts")
      .update({ balance: Number(fromAccount.data.balance) - values.fromAmount, updated_at: new Date().toISOString() })
      .eq("id", values.fromAccountId)
  }
  if (toAccount.data) {
    await supabase
      .from("accounts")
      .update({ balance: Number(toAccount.data.balance) + values.toAmount, updated_at: new Date().toISOString() })
      .eq("id", values.toAccountId)
  }
}
