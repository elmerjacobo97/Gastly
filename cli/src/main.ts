import { runInit } from "./commands/init.js"
import { runLogin } from "./commands/login.js"
import { runLogout } from "./commands/logout.js"
import { runWhoami } from "./commands/whoami.js"
import { runTransactions } from "./commands/transactions.js"
import { runCategories } from "./commands/categories.js"
import { runAccounts } from "./commands/accounts.js"
import { runBalance } from "./commands/balance.js"
import { runBudget } from "./commands/budget.js"
import { runDebts } from "./commands/debts.js"
import { getCliVersion } from "./version.js"
import { writeError } from "./format.js"

const HELP = `gastly-cli — Gastly Personal Finance CLI

Usage:
  gastly-cli <command> [options]

Commands:
  init          Configure Supabase connection (url + publishable key)
  login         Sign in with email/password
  logout        Sign out and clear local session
  whoami        Show the authenticated user
  transactions  Manage transactions (new|list|search|update|delete)
  categories    List categories
  accounts      List accounts with balance and currency
  balance       Show account balances grouped by currency
  budget        Show budget vs spending for the month
  debts         Show all debts: loans, installments, custody, recurring

Options:
  -h, --help       Show help for any command
  -v, --version    Show CLI version
  --json           Output as JSON (most commands)

Examples:
  gastly-cli init --from-env .env.local
  gastly-cli login --email user@example.com --password secret
  gastly-cli transactions new --type expense --amount 100 -d "Groceries"
  gastly-cli transactions list --month 2026-09
  gastly-cli debts --json
`

async function main(argv: string[]): Promise<void> {
  let args = argv.slice(2)
  if (args[0] === "--") args = args.slice(1)

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(`${HELP}\n`)
    return
  }

  if (args[0] === "--version" || args[0] === "-v") {
    process.stdout.write(`${await getCliVersion()}\n`)
    return
  }

  const [command, ...rest] = args

  try {
    switch (command) {
      case "init":
        await runInit(rest)
        return
      case "login":
        await runLogin(rest)
        return
      case "logout":
        await runLogout()
        return
      case "whoami":
        await runWhoami(rest)
        return
      case "transactions":
        await runTransactions(rest)
        return
      case "categories":
        await runCategories(rest)
        return
      case "accounts":
        await runAccounts(rest)
        return
      case "balance":
        await runBalance(rest)
        return
      case "budget":
        await runBudget(rest)
        return
      case "debts":
        await runDebts(rest)
        return
      default:
        writeError(`Unknown command: ${command}\n\n${HELP}`)
        process.exitCode = 1
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    writeError(message)
    process.exitCode = 1
  }
}

main(process.argv)
