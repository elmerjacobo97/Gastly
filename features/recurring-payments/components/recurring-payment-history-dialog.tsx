"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type PaymentHistoryEntry } from "@/features/recurring-payments/server/queries"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"
import { formatCurrency, formatDate } from "@/lib/format"

type RecurringPaymentHistoryDialogProps = {
  payment: RecurringPayment | null
  history: PaymentHistoryEntry[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecurringPaymentHistoryDialog({
  payment,
  history,
  open,
  onOpenChange,
}: RecurringPaymentHistoryDialogProps) {
  const total = history.reduce((sum, entry) => sum + entry.amount, 0)
  const avg = history.length > 0 ? total / history.length : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Historial de pagos</DialogTitle>
          <DialogDescription>
            {payment?.description} · {history.length} pago{history.length !== 1 ? "s" : ""} registrado{history.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin pagos registrados aún.
            </p>
          ) : (
            <>
              <ScrollArea className="max-h-72">
                <div className="flex flex-col divide-y">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize">
                          {format(new Date(`${entry.occurredOn}T12:00:00`), "MMMM yyyy", { locale: es })}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{formatDate(entry.occurredOn)}</p>
                        {entry.notes && (
                          <p className="mt-0.5 text-xs text-muted-foreground italic">{entry.notes}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-sm font-semibold tabular-nums ${payment?.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                        {payment?.type === "income" ? "+" : "-"}{formatCurrency(entry.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Promedio mensual</span>
                <span className="font-semibold tabular-nums">{formatCurrency(avg)}</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
