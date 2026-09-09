import { WalletIcon } from "lucide-react"

import { type Account } from "@/features/accounts/types/account-types"
import { formatCurrency } from "@/lib/format"

export function SummaryCard({ accounts }: { accounts: Account[] }) {
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <div className="rounded-xl border bg-card p-3.5 flex items-center gap-3">
      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <WalletIcon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">Total en cuentas</p>
        <p className="truncate text-xs text-muted-foreground">
          {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""}
        </p>
      </div>
      <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
        {formatCurrency(totalBalance)}
      </p>
    </div>
  )
}
