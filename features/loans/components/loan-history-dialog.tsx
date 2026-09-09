"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RowActionsMenu } from "@/components/row-actions-menu"
import { EditLoanEventDialog } from "@/features/loans/components/edit-loan-event-dialog"
import { historyEntriesForGroup } from "@/features/loans/lib/group-loans"
import {
  deleteLoanDisbursement,
  deleteLoanPayment,
} from "@/features/loans/server/actions"
import { type LoanHistoryEntry, type LoanPersonGroup } from "@/features/loans/types/loan-types"
import { formatCurrency } from "@/lib/format"

type LoanHistoryDialogProps = {
  group: LoanPersonGroup | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoanHistoryDialog({ group, open, onOpenChange }: LoanHistoryDialogProps) {
  const entries = group ? historyEntriesForGroup(group) : []
  const [editEntry, setEditEntry] = useState<LoanHistoryEntry | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<LoanHistoryEntry | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(entry: LoanHistoryEntry) {
    startTransition(async () => {
      try {
        if (entry.kind === "payment") {
          await deleteLoanPayment(entry.id)
          toast.success("Abono eliminado")
        } else {
          await deleteLoanDisbursement(entry.id)
          toast.success("Préstamo eliminado del historial")
        }
        setDeleteEntry(null)
      } catch (error) {
        toast.error("No se pudo eliminar", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Historial</DialogTitle>
            <DialogDescription>
              {group?.personName} · {entries.length} movimiento{entries.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          {entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin movimientos registrados aún.
            </p>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="flex flex-col divide-y">
                {entries.map((entry) => {
                  const isPayment = entry.kind === "payment"
                  return (
                    <div key={`${entry.kind}-${entry.id}`} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {format(new Date(`${entry.occurredOn}T12:00:00`), "d MMM yyyy", { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isPayment ? "Abono" : group?.direction === "borrowed" ? "Me prestaron" : "Presté"}
                          {" · "}
                          {entry.currency}
                        </p>
                        {entry.notes && (
                          <p className="mt-0.5 text-xs text-muted-foreground italic">{entry.notes}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-start gap-1">
                        <span
                          className={`pt-0.5 text-sm font-semibold tabular-nums ${
                            isPayment
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          {isPayment ? "+" : ""}
                          {formatCurrency(entry.amount, entry.currency)}
                        </span>
                        <RowActionsMenu
                          onEdit={() => setEditEntry(entry)}
                          onDelete={() => setDeleteEntry(entry)}
                          editLabel="Editar monto"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {editEntry && (
        <EditLoanEventDialog
          entry={editEntry}
          open={!!editEntry}
          onOpenChange={(next) => !next && setEditEntry(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteEntry)}
        onOpenChange={(next) => !next && setDeleteEntry(null)}
        description={
          deleteEntry?.kind === "payment"
            ? "Se eliminará este abono y el pendiente se recalculará."
            : "Se eliminará este préstamo del historial y el saldo se recalculará."
        }
        pending={isPending}
        onConfirm={() => deleteEntry && handleDelete(deleteEntry)}
      />
    </>
  )
}
