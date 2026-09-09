import { createAuthedClient } from "../supabase-client.js"
import { hasFlag } from "../flags.js"
import { formatCurrency, writeJson, writeLine } from "../format.js"
import type { AccountRecord } from "../types.js"

export async function runAccounts(args: string[]): Promise<void> {
  if (hasFlag(args, "--help") || hasFlag(args, "-h")) {
    process.stdout.write(`Usage:\n  gastly-cli accounts list [--json]\n\nList all accounts with currency and balance.\n`)
    return
  }

  const json = hasFlag(args, "--json")
  const { supabase } = await createAuthedClient()

  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, currency, balance, color, notes")
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)

  const accounts: AccountRecord[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    currency: row.currency,
    balance: Number(row.balance),
    color: row.color,
    notes: row.notes,
  }))

  if (json) {
    writeJson(accounts)
  } else {
    if (accounts.length === 0) {
      writeLine("No accounts found.")
      return
    }
    for (const acc of accounts) {
      writeLine(
        `  ${acc.name.padEnd(20)} ${formatCurrency(acc.balance, acc.currency).padStart(14)}  (${acc.currency})`,
      )
    }
    writeLine(`\n${accounts.length} account(s)`)
  }
}
