import { DownloadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type AccountTransfer } from "@/features/accounts/types/account-types"
import { formatCurrency, formatDate } from "@/lib/format"

export function TransfersList({
  transfers,
  onExport,
}: {
  transfers: AccountTransfer[]
  onExport: () => void
}) {
  if (transfers.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Transferencias recientes</h2>
        <Button variant="outline" size="sm" onClick={onExport}>
          <DownloadIcon className="size-3.5" />
          Exportar CSV
        </Button>
      </div>
      <Card>
        <CardContent className="divide-y p-0">
          {transfers.slice(0, 10).map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {t.fromAccountName} → {t.toAccountName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDate(t.occurredOn)}
                  {t.notes && ` · ${t.notes}`}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium tabular-nums text-destructive">
                -{formatCurrency(t.amount)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
