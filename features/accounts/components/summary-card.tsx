import { WalletIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type Account } from "@/features/accounts/types/account-types"
import { formatCurrency } from "@/lib/format"

export function SummaryCard({ accounts }: { accounts: Account[] }) {
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-xs font-medium text-muted-foreground">Total en cuentas</CardTitle>
        <CardAction>
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <WalletIcon className="size-4" />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""}
        </p>
        <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
          {formatCurrency(totalBalance)}
        </p>
      </CardContent>
    </Card>
  )
}
