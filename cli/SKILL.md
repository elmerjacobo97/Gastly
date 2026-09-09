# gastly-cli

CLI for Gastly personal finance tracker. Manage transactions, debts, budgets, and accounts from the terminal. Designed for use by AI agents.

## Installation

```bash
npm install -g @codigoconelmer/gastly-cli
# or run directly:
npx @codigoconelmer/gastly-cli --help
```

## Setup

```bash
# 1. Configure (reads from .env.local automatically)
gastly-cli init --from-env /path/to/gastly/.env.local

# 2. Login
gastly-cli login --email user@example.com --password <password>
```

Session is stored in `~/.gastly/session.json` and refreshed automatically.

## Agent Usage Patterns

All commands support `--json` for machine-readable output.

### Record an expense

```bash
gastly-cli transactions new --type expense --amount 100 -d "Groceries" --json
```

Optional: `--category <name>`, `--date YYYY-MM-DD`, `--notes <text>`.

### Record income

```bash
gastly-cli transactions new --type income --amount 5000 -d "Salary" --json
```

### List recent transactions

```bash
gastly-cli transactions list --month 2026-09 --json
gastly-cli transactions list --type expense --limit 10 --json
```

### Search transactions

```bash
gastly-cli transactions search "groceries" --json
```

### Update a transaction

```bash
gastly-cli transactions update <id> --amount 150 -d "Updated description" --json
```

### Delete a transaction

```bash
gastly-cli transactions delete <id> --yes --json
```

### Check debts (how much do I owe?)

```bash
gastly-cli debts --json
```

Returns: loans (borrowed/lent by currency), pending installments, custody holdings, and recurring payments for the current month.

### Check balance

```bash
gastly-cli balance --json
```

Returns account balances grouped by currency (PEN/USD).

### Check budget

```bash
gastly-cli budget --month 2026-09 --json
```

### List categories

```bash
gastly-cli categories list --json
gastly-cli categories list --type expense --json
```

### List accounts

```bash
gastly-cli accounts list --json
```

## Output Format

Without `--json`: human-readable table with aligned columns.
With `--json`: JSON array or object, suitable for programmatic consumption.

## Error Handling

- Category not found → exit 1 with available alternatives
- Transaction not found → exit 1
- Not logged in → exit 1 with "Run: gastly-cli login"
- Invalid amount → exit 1

## Currency

All transactions are PEN (Peruvian Sol). Loans and accounts support PEN/USD/MXN.

## Auth

Session tokens auto-refresh on each command. If refresh fails, re-login.
