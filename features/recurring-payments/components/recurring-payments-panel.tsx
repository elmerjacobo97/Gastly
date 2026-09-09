"use client"

import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { MonthNav } from "@/components/month-nav"
import { CreateRecurringPaymentDialog } from "@/features/recurring-payments/components/create-recurring-payment-dialog"
import { EditRecurringPaymentDialog } from "@/features/recurring-payments/components/edit-recurring-payment-dialog"
import { RecurringPaymentAlerts } from "@/features/recurring-payments/components/recurring-payment-alerts"
import { RecurringPaymentHistoryDialog } from "@/features/recurring-payments/components/recurring-payment-history-dialog"
import { RecurringPaymentList } from "@/features/recurring-payments/components/recurring-payment-list"
import { RecurringPaymentPayDialog } from "@/features/recurring-payments/components/recurring-payment-pay-dialog"
import { RecurringPaymentSummaryCards } from "@/features/recurring-payments/components/recurring-payment-summary-cards"
import { RecurringPaymentsEmptyState } from "@/features/recurring-payments/components/recurring-payments-empty-state"
import {
  deleteRecurringPayment,
  registerRecurringPaymentPayment,
  setRecurringPaymentActive,
} from "@/features/recurring-payments/server/actions"
import { type PaymentHistoryEntry } from "@/features/recurring-payments/server/queries"
import { type RecurringPaymentPaymentValues } from "@/features/recurring-payments/schemas/recurring-payment-schemas"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"
import { type Account } from "@/features/accounts/types/account-types"
import { type Category } from "@/features/categories/types/category-types"

type RecurringPaymentsPanelProps = {
  payments: RecurringPayment[]
  historyByPaymentId: Record<string, PaymentHistoryEntry[]>
  accounts: Account[]
  categories: Category[]
  month: string
}

export function RecurringPaymentsPanel({
  payments,
  historyByPaymentId,
  accounts,
  categories,
  month: monthStr,
}: RecurringPaymentsPanelProps) {
  const [editPayment, setEditPayment] = useState<RecurringPayment | null>(null)
  const [payPayment, setPayPayment] = useState<RecurringPayment | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [historyPayment, setHistoryPayment] = useState<RecurringPayment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const month = useMemo(() => new Date(`${monthStr}-01T12:00:00`), [monthStr])
  const monthKey = format(month, "yyyy-MM")

  function handleRegister(values: RecurringPaymentPaymentValues) {
    if (!payPayment) return
    startTransition(async () => {
      try {
        await registerRecurringPaymentPayment(payPayment, values)
        toast.success("Pago registrado como transacción")
        setPayOpen(false)
        setPayPayment(null)
        router.refresh()
      } catch (error) {
        toast.error("No se pudo registrar el pago", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  function handleToggle(payment: RecurringPayment) {
    startTransition(async () => {
      try {
        await setRecurringPaymentActive(payment.id, !payment.isActive)
        toast.success(payment.isActive ? "Pago recurrente pausado" : "Pago recurrente activado")
        router.refresh()
      } catch (error) {
        toast.error("No se pudo actualizar el estado", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  function handleDelete() {
    if (!deleteId) return
    startTransition(async () => {
      try {
        await deleteRecurringPayment(deleteId)
        toast.success("Pago recurrente eliminado")
        setDeleteId(null)
        router.refresh()
      } catch (error) {
        toast.error("No se pudo eliminar el pago recurrente", {
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
            Pagos recurrentes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Usa montos estimados para planificar y registra el monto real cuando pagues.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav value={month} allowFuture />
          <CreateRecurringPaymentDialog accounts={accounts} categories={categories} />
        </div>
      </section>

      {payments.length > 0 && <RecurringPaymentSummaryCards payments={payments} monthKey={monthKey} />}

      <RecurringPaymentAlerts payments={payments} monthKey={monthKey} />

      <RecurringPaymentList
        payments={payments}
        monthKey={monthKey}
        pending={isPending}
        onPay={(payment) => {
          setPayPayment(payment)
          setPayOpen(true)
        }}
        onEdit={setEditPayment}
        onHistory={setHistoryPayment}
        onToggle={handleToggle}
        onDelete={setDeleteId}
      />

      {payments.length === 0 && (
        <RecurringPaymentsEmptyState accounts={accounts} categories={categories} />
      )}

      {editPayment && (
        <EditRecurringPaymentDialog
          payment={editPayment}
          accounts={accounts}
          categories={categories}
          open={!!editPayment}
          onOpenChange={(open) => !open && setEditPayment(null)}
        />
      )}
      <RecurringPaymentPayDialog
        payment={payPayment}
        open={payOpen}
        pending={isPending}
        onOpenChange={setPayOpen}
        onSubmit={handleRegister}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar pago recurrente"
        description="Esta acción no elimina transacciones ya registradas, solo el pago recurrente."
        confirmLabel="Eliminar"
        pending={isPending}
        onConfirm={handleDelete}
      />
      <RecurringPaymentHistoryDialog
        payment={historyPayment}
        history={historyPayment ? historyByPaymentId[historyPayment.id] ?? [] : []}
        open={!!historyPayment}
        onOpenChange={(open) => !open && setHistoryPayment(null)}
      />
    </main>
  )
}
