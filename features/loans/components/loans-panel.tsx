"use client"

import { HandCoinsIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EditLoanDialog } from "@/features/loans/components/edit-loan-dialog"
import { LoanDialog } from "@/features/loans/components/loan-dialog"
import { LoanHistoryDialog } from "@/features/loans/components/loan-history-dialog"
import { LoansSections } from "@/features/loans/components/loans-sections"
import { LoansSummaryCards } from "@/features/loans/components/loans-summary-cards"
import { uniquePersonNames, groupLoansByPerson } from "@/features/loans/lib/group-loans"
import { deleteLoanBalances } from "@/features/loans/server/actions"
import { type Loan, type LoanPersonGroup } from "@/features/loans/types/loan-types"

type LoansPanelProps = {
  loans: Loan[]
}

export function LoansPanel({ loans }: LoansPanelProps) {
  const [isMutationPending, startTransition] = useTransition()
  const [deleteGroup, setDeleteGroup] = useState<LoanPersonGroup | null>(null)
  const [editGroup, setEditGroup] = useState<LoanPersonGroup | null>(null)
  const [historyGroup, setHistoryGroup] = useState<LoanPersonGroup | null>(null)
  const personNames = uniquePersonNames(loans)
  const groups = groupLoansByPerson(loans)
  const liveEditGroup = editGroup
    ? groups.find((group) => group.key === editGroup.key) ?? null
    : null
  const liveHistoryGroup = historyGroup
    ? groups.find((group) => group.key === historyGroup.key) ?? null
    : null

  function handleDelete(group: LoanPersonGroup) {
    startTransition(async () => {
      try {
        await deleteLoanBalances(group.balances.map((loan) => loan.id))
        toast.success("Préstamo eliminado")
        setDeleteGroup(null)
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
        <LoanDialog loans={loans} personNames={personNames} />
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
          <LoanDialog
            triggerLabel="Registrar primer préstamo"
            loans={loans}
            personNames={personNames}
          />
        </div>
      )}

      {loans.length > 0 && (
        <LoansSections
          loans={loans}
          onEdit={setEditGroup}
          onHistory={setHistoryGroup}
          onDelete={setDeleteGroup}
        />
      )}

      {liveEditGroup && (
        <EditLoanDialog
          group={liveEditGroup}
          open={!!editGroup}
          onOpenChange={(open) => !open && setEditGroup(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteGroup)}
        onOpenChange={(open) => !open && setDeleteGroup(null)}
        description="Se eliminará esta persona y todo su historial de préstamos y abonos, en todas las monedas."
        pending={isMutationPending}
        onConfirm={() => deleteGroup && handleDelete(deleteGroup)}
      />

      <LoanHistoryDialog
        group={liveHistoryGroup}
        open={!!historyGroup}
        onOpenChange={(open) => !open && setHistoryGroup(null)}
      />
    </main>
  )
}
