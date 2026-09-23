import { createAuthedClient } from "../supabase-client.js"
import { hasFlag } from "../flags.js"
import { writeJson, writeLine } from "../format.js"
import type { CategoryRecord, TransactionType } from "../types.js"

const CATEGORIES_HELP = `Usage:
  gastly-cli categories list [--type <expense|income>] [--json]

Options:
  --type <expense|income>   Filter by type
  --json                    Output as JSON
`

export async function runCategories(args: string[]): Promise<void> {
  const subcommand = args[0]
  if (subcommand !== "list" && subcommand !== undefined) {
    process.stdout.write(`${CATEGORIES_HELP}\n`)
    return
  }
  if (hasFlag(args, "--help") || hasFlag(args, "-h")) {
    process.stdout.write(`${CATEGORIES_HELP}\n`)
    return
  }

  const json = hasFlag(args, "--json")
  const type = args.includes("--type")
    ? (args[args.indexOf("--type") + 1] as TransactionType)
    : undefined

  const { supabase } = await createAuthedClient()

  let query = supabase
    .from("categories")
    .select("id, name, type, color, icon")
    .order("type", { ascending: true })
    .order("name", { ascending: true })

  if (type) query = query.eq("type", type)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const categories: CategoryRecord[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type as TransactionType,
    color: row.color,
    icon: row.icon,
  }))

  if (json) {
    writeJson(categories)
  } else {
    if (categories.length === 0) {
      writeLine("No categories found.")
      return
    }
    let currentType: string | null = null
    for (const cat of categories) {
      if (cat.type !== currentType) {
        currentType = cat.type
        writeLine(`\n${cat.type === "expense" ? "Expenses" : "Income"}:`)
      }
      writeLine(`  ${cat.icon} ${cat.name}`)
    }
    writeLine(`\n${categories.length} category(ies)`)
  }
}
