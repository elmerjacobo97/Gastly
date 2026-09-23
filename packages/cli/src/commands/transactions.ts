import { createAuthedClient } from "../supabase-client.js"
import {
  getFlagValue,
  hasFlag,
  todayString,
  promptConfirm,
} from "../flags.js"
import {
  formatCurrency,
  formatDate,
  writeJson,
  writeLine,
  writeError,
} from "../format.js"
import type { TransactionRecord, TransactionType } from "../types.js"

function joinField(
  join: unknown,
  field: string,
): string | null {
  if (!join) return null
  if (Array.isArray(join)) return (join[0] as Record<string, unknown>)?.[field] as string ?? null
  return (join as Record<string, unknown>)[field] as string ?? null
}

const TRANSACTIONS_HELP = `Usage:
  gastly-cli transactions <subcommand> [options]

Subcommands:
  new       Create a transaction (expense or income)
  list      List recent transactions
  search    Search transactions by description
  update    Update an existing transaction
  delete    Delete a transaction

Common options:
  --json    Output as JSON
`

const NEW_HELP = `Usage:
  gastly-cli transactions new --type <expense|income> --amount <N> -d <description> [options]

Required:
  --type <expense|income>   Transaction type
  --amount <N>              Amount (must be > 0)
  -d, --description <text>  Description (min 2 chars)

Optional:
  --category <name>         Category name (must exist)
  --date <YYYY-MM-DD>       Occurred on (defaults to today)
  --notes <text>            Additional notes
  --json                    Output created transaction as JSON
`

const UPDATE_HELP = `Usage:
  gastly-cli transactions update <id> [options]

Options:
  --type <expense|income>   New type
  --amount <N>              New amount
  -d, --description <text>  New description
  --category <name>         New category name
  --date <YYYY-MM-DD>       New date
  --notes <text>            New notes (omit flag to keep, use "" to clear)
  --json                    Output updated transaction as JSON
`

const DELETE_HELP = `Usage:
  gastly-cli transactions delete <id> [--yes]

Options:
  --yes     Skip confirmation prompt
  --json    Output result as JSON
`

export async function runTransactions(args: string[]): Promise<void> {
  const subcommand = args[0]
  const rest = args.slice(1)

  switch (subcommand) {
    case "new":
      await runNew(rest)
      return
    case "list":
      await runList(rest)
      return
    case "search":
      await runSearch(rest)
      return
    case "update":
      await runUpdate(rest)
      return
    case "delete":
      await runDelete(rest)
      return
    default:
      process.stdout.write(`${TRANSACTIONS_HELP}\n`)
      return
  }
}

async function resolveCategoryId(
  supabase: Awaited<ReturnType<typeof createAuthedClient>>["supabase"],
  userId: string,
  categoryName: string,
  _type: TransactionType,
): Promise<string> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId)
    .ilike("name", categoryName)

  if (error) throw new Error(error.message)

  if (!data || data.length === 0) {
    throw new Error(
      `Category "${categoryName}" not found. Available categories:\n` +
        "Run: gastly-cli categories list",
    )
  }

  const exact = data.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
  )
  if (exact) return exact.id

  if (data.length === 1) return data[0].id

  throw new Error(
    `Ambiguous category "${categoryName}". Matches: ${data.map((c) => c.name).join(", ")}. ` +
      "Use the exact name.",
  )
}

async function runNew(args: string[]): Promise<void> {
  if (hasFlag(args, "--help") || hasFlag(args, "-h")) {
    process.stdout.write(`${NEW_HELP}\n`)
    return
  }

  const json = hasFlag(args, "--json")
  const type = getFlagValue(args, "--type") as TransactionType | undefined
  const amountStr = getFlagValue(args, "--amount")
  const description = getFlagValue(args, "-d") ?? getFlagValue(args, "--description")
  const categoryName = getFlagValue(args, "--category")
  const date = getFlagValue(args, "--date") ?? todayString()
  const notes = getFlagValue(args, "--notes")

  if (!type || (type !== "expense" && type !== "income")) {
    writeError("--type must be 'expense' or 'income'")
    process.exitCode = 1
    return
  }
  if (!amountStr) {
    writeError("--amount is required and must be > 0")
    process.exitCode = 1
    return
  }
  const amount = Number(amountStr)
  if (isNaN(amount) || amount <= 0) {
    writeError("--amount must be a positive number")
    process.exitCode = 1
    return
  }
  if (!description || description.length < 2) {
    writeError("-d/--description is required (min 2 chars)")
    process.exitCode = 1
    return
  }

  const { supabase, session } = await createAuthedClient()

  let categoryId: string | null = null
  if (categoryName) {
    categoryId = await resolveCategoryId(supabase, session.userId, categoryName, type)
  } else {
    const { data: defaultCat } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", session.userId)
      .eq("type", type)
      .limit(1)
      .single()
    categoryId = defaultCat?.id ?? null
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: session.userId,
      category_id: categoryId,
      type,
      amount,
      description,
      occurred_on: date,
      notes: notes || null,
      payment_method: "cash",
    })
    .select("id, type, amount, description, occurred_on, notes, categories(name)")
    .single()

  if (error) throw new Error(error.message)

  const record: TransactionRecord = {
    id: data.id,
    type: data.type as TransactionType,
    amount: Number(data.amount),
    description: data.description,
    occurredOn: data.occurred_on,
    notes: data.notes,
    categoryName: joinField(data.categories, "name"),
    categoryType: null,
    paymentMethod: "cash",
    createdAt: "",
  }

  if (json) {
    writeJson(record)
  } else {
    writeLine(`Transaction created: ${record.id}`)
    writeLine(
      `  ${record.type === "expense" ? "-" : "+"}${formatCurrency(record.amount)} ` +
        `"${record.description}" on ${formatDate(record.occurredOn)}` +
        (record.categoryName ? ` [${record.categoryName}]` : ""),
    )
  }
}

async function runList(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const type = getFlagValue(args, "--type") as TransactionType | undefined
  const month = getFlagValue(args, "--month")
  const limitStr = getFlagValue(args, "--limit")
  const limit = limitStr ? Math.min(Number(limitStr), 500) : 50

  const { supabase } = await createAuthedClient()

  let query = supabase
    .from("transactions")
    .select(
      "id, type, amount, description, occurred_on, notes, payment_method, categories(name, type), created_at",
    )
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (type) query = query.eq("type", type)

  if (month) {
    const match = month.match(/^(\d{4})-(\d{2})$/)
    if (match) {
      const year = Number(match[1])
      const mo = Number(match[2])
      const start = `${year}-${String(mo).padStart(2, "0")}-01`
      const lastDay = new Date(year, mo, 0).getDate()
      const end = `${year}-${String(mo).padStart(2, "0")}-${lastDay}`
      query = query.gte("occurred_on", start).lte("occurred_on", end)
    }
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const transactions: TransactionRecord[] = (data ?? []).map((row) => ({
    id: row.id,
    type: row.type as TransactionType,
    amount: Number(row.amount),
    description: row.description,
    occurredOn: row.occurred_on,
    notes: row.notes,
    categoryName: joinField(row.categories, "name"),
    categoryType: joinField(row.categories, "type") as TransactionType | null,
    paymentMethod: row.payment_method ?? "cash",
    createdAt: row.created_at,
  }))

  if (json) {
    writeJson(transactions)
  } else {
    if (transactions.length === 0) {
      writeLine("No transactions found.")
      return
    }
    for (const tx of transactions) {
      const sign = tx.type === "expense" ? "-" : "+"
      writeLine(
        `${tx.id.slice(0, 8)}  ${sign}${formatCurrency(tx.amount).padStart(12)}  ` +
          `${formatDate(tx.occurredOn)}  ${tx.description}` +
          (tx.categoryName ? ` [${tx.categoryName}]` : ""),
      )
    }
    writeLine(`\n${transactions.length} transaction(s)`)
  }
}

async function runSearch(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const query = args.find((a) => !a.startsWith("--"))
  if (!query) {
    writeError("Provide a search term: gastly-cli transactions search <text>")
    process.exitCode = 1
    return
  }

  const { supabase } = await createAuthedClient()
  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, amount, description, occurred_on, notes, categories(name, type)")
    .ilike("description", `%${query}%`)
    .order("occurred_on", { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)

  const transactions: TransactionRecord[] = (data ?? []).map((row) => ({
    id: row.id,
    type: row.type as TransactionType,
    amount: Number(row.amount),
    description: row.description,
    occurredOn: row.occurred_on,
    notes: row.notes,
    categoryName: joinField(row.categories, "name"),
    categoryType: joinField(row.categories, "type") as TransactionType | null,
    paymentMethod: "cash",
    createdAt: "",
  }))

  if (json) {
    writeJson(transactions)
  } else {
    if (transactions.length === 0) {
      writeLine(`No transactions matching "${query}".`)
      return
    }
    for (const tx of transactions) {
      const sign = tx.type === "expense" ? "-" : "+"
      writeLine(
        `${tx.id.slice(0, 8)}  ${sign}${formatCurrency(tx.amount).padStart(12)}  ` +
          `${formatDate(tx.occurredOn)}  ${tx.description}` +
          (tx.categoryName ? ` [${tx.categoryName}]` : ""),
      )
    }
    writeLine(`\n${transactions.length} match(es)`)
  }
}

async function runUpdate(args: string[]): Promise<void> {
  if (hasFlag(args, "--help") || hasFlag(args, "-h")) {
    process.stdout.write(`${UPDATE_HELP}\n`)
    return
  }

  const json = hasFlag(args, "--json")
  const id = args.find((a) => !a.startsWith("--"))
  if (!id) {
    writeError("Transaction ID required: gastly-cli transactions update <id>")
    process.exitCode = 1
    return
  }

  const { supabase, session } = await createAuthedClient()

  const { data: existing, error: fetchError } = await supabase
    .from("transactions")
    .select("id, type, amount, description, occurred_on, notes, category_id")
    .eq("id", id)
    .single()

  if (fetchError || !existing) {
    writeError(`Transaction ${id} not found.`)
    process.exitCode = 1
    return
  }

  const type = (getFlagValue(args, "--type") as TransactionType) ?? (existing.type as TransactionType)
  const amountStr = getFlagValue(args, "--amount")
  const amount = amountStr ? Number(amountStr) : Number(existing.amount)
  const description = getFlagValue(args, "-d") ?? getFlagValue(args, "--description") ?? existing.description
  const date = getFlagValue(args, "--date") ?? existing.occurred_on
  const notes = getFlagValue(args, "--notes") ?? existing.notes
  const categoryName = getFlagValue(args, "--category")

  if (amountStr && (isNaN(amount) || amount <= 0)) {
    writeError("--amount must be a positive number")
    process.exitCode = 1
    return
  }

  let categoryId = existing.category_id
  if (categoryName) {
    categoryId = await resolveCategoryId(supabase, session.userId, categoryName, type)
  }

  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      type,
      amount,
      description,
      occurred_on: date,
      notes: notes === "" ? null : notes,
      category_id: categoryId,
    })
    .eq("id", id)

  if (updateError) throw new Error(updateError.message)

  if (json) {
    writeJson({ id, updated: true })
  } else {
    writeLine(`Transaction ${id} updated.`)
  }
}

async function runDelete(args: string[]): Promise<void> {
  if (hasFlag(args, "--help") || hasFlag(args, "-h")) {
    process.stdout.write(`${DELETE_HELP}\n`)
    return
  }

  const json = hasFlag(args, "--json")
  const yes = hasFlag(args, "--yes")
  const id = args.find((a) => !a.startsWith("--"))
  if (!id) {
    writeError("Transaction ID required: gastly-cli transactions delete <id>")
    process.exitCode = 1
    return
  }

  if (!yes) {
    const confirmed = await promptConfirm(`Delete transaction ${id}?`)
    if (!confirmed) {
      writeLine("Cancelled.")
      return
    }
  }

  const { supabase } = await createAuthedClient()
  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) throw new Error(error.message)

  if (json) {
    writeJson({ id, deleted: true })
  } else {
    writeLine(`Transaction ${id} deleted.`)
  }
}
