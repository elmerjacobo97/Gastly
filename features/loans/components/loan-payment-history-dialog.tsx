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
import { type Loan } from "@/features/loans/types/loan-types"
import { formatCurrency } from "@/lib/format"

type LoanPaymentHistoryDialogProps = {
  loan: Loan | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoanPaymentHistoryDialog({
  loan,
  open,
  onOpenChange,
}: LoanPaymentHistoryDialogProps) {
  const payments = loan?.payments ?? []
  const total = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Historial de abonos</DialogTitle>
          <DialogDescription>
            {loan?.personName} · {payments.length} abono{payments.length !== 1 ? "s" : ""} registrado{payments.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>
        {payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sin abonos registrados aún.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <ScrollArea className="max-h-72">
              <div className="flex flex-col divide-y">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {format(new Date(`${p.occurredOn}T12:00:00`), "d MMM yyyy", { locale: es })}
                      </p>
                      {p.notes && (
                        <p className="mt-0.5 text-xs text-muted-foreground italic">{p.notes}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Total abonado</span>
              <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
