"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { CreateGoalDialog } from "@/features/savings/components/create-goal-dialog"
import { EditGoalDialog } from "@/features/savings/components/edit-goal-dialog"
import { GoalsSection } from "@/features/savings/components/goals-section"
import { SummaryCards } from "@/features/savings/components/summary-cards"
import { deleteSavingsGoal } from "@/lib/finance/savings/server/actions"
import { type SavingsGoal } from "@/lib/finance/savings/types/savings-types"

type SavingsPanelProps = {
  goals: SavingsGoal[]
}

export function SavingsPanel({ goals }: SavingsPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteSavingsGoal(id)
        toast.success("Meta eliminada")
        setDeleteId(null)
      } catch (error) {
        toast.error("No se pudo eliminar la meta", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Metas de ahorro
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define objetivos y sigue tu progreso hacia ellos.
          </p>
        </div>
        <CreateGoalDialog />
      </section>

      {goals.length > 0 && <SummaryCards goals={goals} />}

      <GoalsSection goals={goals} onEdit={setEditGoal} onDelete={setDeleteId} />

      {editGoal && (
        <EditGoalDialog
          goal={editGoal}
          open={Boolean(editGoal)}
          onOpenChange={(o) => !o && setEditGoal(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        description="Se eliminará esta meta permanentemente junto con su progreso."
        pending={isPending}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </main>
  )
}
