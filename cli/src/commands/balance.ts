import { createAuthedClient } from "../supabase-client.js"
import { hasFlag } from "../flags.js"
import { formatCurrency, writeJson, writeLine } from "../format.js"
import type { BalanceRecord } from "../types.js"

export async function runBalance(args: string[]): Promise<void> {
  if (hasFlag(args, "--help") || hasFlag(args, "-h")) {
    process.stdout.write(`Usage:\n  gastly-cli balance [--json]\n\nShow account balances grouped by currency.\n`)
    return
  }

  const json = hasFlag(args, "--json")
  const { supabase } = await createAuthedClient()

  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, currency, balance, color")
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)

  const accounts: BalanceRecord[] = (data ?? []).map((row) => ({
    accountId: row.id,
    accountName: row.name,
    currency: row.currency,
    balance: Number(row.balance),
    color: row.color,
  }))

  if (json) {
    writeJson(accounts)
  } else {
    if (accounts.length === 0) {
      writeLine("No accounts found.")
      return
    }

    const byCurrency = new Map<string, BalanceRecord[]>()
    for (const acc of accounts) {
      const list = byCurrency.get(acc.currency) ?? []
      list.push(acc)
      byCurrency.set(acc.currency, list)
    }

    for (const [currency, accs] of byCurrency) {
      const total = accs.reduce((s, a) => s + a.balance, 0)
      writeLine(`\n${currency}:`)
      for (const acc of accs) {
        writeLine(`  ${acc.accountName.padEnd(20)} ${formatCurrency(acc.balance, currency).padStart(14)}`)
      }
      writeLine(`  ${"Total".padEnd(20)} ${formatCurrency(total, currency).padStart(14)}`)
    }
  }
}
