"use client"

import { HandCoinsIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EditLoanDialog } from "@/features/loans/components/edit-loan-dialog"
import { LoanDialog } from "@/features/loans/components/loan-dialog"
import { LoanPaymentHistoryDialog } from "@/features/loans/components/loan-payment-history-dialog"
import { LoansSections } from "@/features/loans/components/loans-sections"
import { LoansSummaryCards } from "@/features/loans/components/loans-summary-cards"
import { deleteLoan } from "@/features/loans/server/actions"
import { type Loan } from "@/features/loans/types/loan-types"

type LoansPanelProps = {
  loans: Loan[]
}

export function LoansPanel({ loans }: LoansPanelProps) {
  const [isMutationPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editLoan, setEditLoan] = useState<Loan | null>(null)
  const [historyLoan, setHistoryLoan] = useState<Loan | null>(null)

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteLoan(id)
        toast.success("Préstamo eliminado")
        setDeleteId(null)
      } catch (error) {
        toast.error("No se pudo eliminar el préstamo", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Préstamos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Préstamos y deudas con terceros. Registra abonos para hacer seguimiento.
          </p>
        </div>
        <LoanDialog />
      </section>

      {loans.length > 0 && <LoansSummaryCards loans={loans} />}

      {loans.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <HandCoinsIcon className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No hay préstamos registrados</p>
            <p className="text-sm text-muted-foreground">
              Registra el dinero que prestas para hacerle seguimiento.
            </p>
          </div>
          <LoanDialog triggerLabel="Registrar primer préstamo" />
        </div>
      )}

      {loans.length > 0 && (
        <LoansSections
          loans={loans}
          onEdit={setEditLoan}
          onHistory={setHistoryLoan}
          onDelete={setDeleteId}
        />
      )}

      {editLoan && (
        <EditLoanDialog
          loan={editLoan}
          open={!!editLoan}
          onOpenChange={(o) => !o && setEditLoan(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        description="Se eliminará este préstamo y todo su historial de abonos permanentemente."
        pending={isMutationPending}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />

      <LoanPaymentHistoryDialog
        loan={historyLoan}
        open={!!historyLoan}
        onOpenChange={(o) => !o && setHistoryLoan(null)}
      />
    </main>
  )
}
