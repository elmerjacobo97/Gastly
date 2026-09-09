# `@codigoconelmer/gastly-cli` (`gastly-cli`)

Node CLI for **Gastly** — personal finance tracker. Manage transactions, debts, budgets, and accounts from the terminal. Designed for both human use and AI agents.

npm package: **`@codigoconelmer/gastly-cli`**. Binary name: **`gastly-cli`**.

## Install

```bash
npm install -g @codigoconelmer/gastly-cli
gastly-cli --version
gastly-cli --help
```

Or run without installing:

```bash
npx @codigoconelmer/gastly-cli --help
```

Package page: https://www.npmjs.com/package/@codigoconelmer/gastly-cli

## Setup (from this repo)

```bash
cd cli
pnpm install
pnpm build

# optional: link globally
pnpm link --global
```

## Configure and sign in

```bash
# Auto-read from .env.local
gastly-cli init --from-env ../.env.local

# Or explicit values
gastly-cli init --url https://yadpullgqqehyusoonxs.supabase.co --key <publishable-key>

# Sign in
gastly-cli login --email you@example.com
gastly-cli whoami
gastly-cli logout
```

Config and session live under `~/.gastly/` with `0600` file modes. Authenticated commands auto-refresh tokens before each request.

## Commands

### Transactions

```bash
# Create expense
gastly-cli transactions new --type expense --amount 100 -d "Groceries"

# Create income
gastly-cli transactions new --type income --amount 5000 -d "Salary"

# With options
gastly-cli transactions new --type expense --amount 50 -d "Lunch" \
  --category "Food" --date 2026-09-08 --notes "With team"

# List recent
gastly-cli transactions list
gastly-cli transactions list --month 2026-09 --type expense --limit 10

# Search by description
gastly-cli transactions search "groceries"

# Update
gastly-cli transactions update <id> --amount 150 -d "Updated description"

# Delete (with confirmation)
gastly-cli transactions delete <id>
gastly-cli transactions delete <id> --yes
```

### Categories

```bash
gastly-cli categories list
gastly-cli categories list --type expense
gastly-cli categories list --json
```

### Accounts

```bash
gastly-cli accounts list
gastly-cli accounts list --json
```

### Balance

Account balances grouped by currency (PEN/USD):

```bash
gastly-cli balance
gastly-cli balance --json
```

### Budget

Budget vs actual spending for the month:

```bash
gastly-cli budget
gastly-cli budget --month 2026-09
gastly-cli budget --json
```

### Debts

All debts in one view — loans, installments, custody, and recurring payments:

```bash
gastly-cli debts
gastly-cli debts --json
```

Output includes:
- **Loans borrowed** (I owe) — grouped by currency
- **Loans lent** (they owe me) — grouped by currency
- **Installments** — pending payments
- **Custody** — amounts held for others
- **Recurring payments** — this month's expenses

## JSON Output

All commands support `--json` for machine-readable output. Use with `jq` or pipe to AI agents:

```bash
gastly-cli debts --json | jq '.loansBorrowed'
gastly-cli transactions list --json | jq '.[] | select(.type == "expense")'
```

## Currency

Transactions are PEN (Peruvian Sol) by default. Loans and accounts support PEN, USD, and MXN.

## Agent Usage

This CLI is designed for AI agents. See `SKILL.md` for agent-specific patterns.

Quick examples:

```bash
# Record an expense
gastly-cli transactions new --type expense --amount 100 -d "Groceries" --json

# Check debts
gastly-cli debts --json

# Monthly summary
gastly-cli transactions list --month 2026-09 --json
```

## Tests

```bash
cd cli
pnpm test
```

Unit tests validate flag parsing, config/session parsing, and formatting. They do not call the live backend.

## License

MIT — see [LICENSE](./LICENSE).
