"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { DownloadIcon } from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { CsvExportConfirmDialog } from "@/components/csv-export-confirm-dialog"
import { DataTable, type DataTableFeatures } from "@/components/ui/data-table"
import { MonthNav } from "@/components/month-nav"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { CreateTransactionDialog } from "@/components/create-transaction-dialog"
import { EditTransactionDialog } from "@/features/transactions/components/edit-transaction-dialog"
import { createMovementsColumns } from "@/features/transactions/components/movements-columns"
import { MovementsEmptyState } from "@/features/transactions/components/movements-empty-state"
import { MovementsSummaryCards } from "@/features/transactions/components/movements-summary-cards"
import { exportTransactionsToCSV } from "@/features/transactions/lib/export-transactions-csv"
import { transactionAddLabel, movementsCardTitle } from "@/features/transactions/lib/movements-labels"
import { deleteTransaction } from "@/features/transactions/server/actions"
import { type Transaction } from "@/features/transactions/types/transaction-types"
import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"
import { type Category } from "@/features/categories/types/category-types"

type TypeFilter = "all" | TransactionType

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
]

type MovementsPanelProps = {
  transactions: Transaction[]
  categories: Category[]
  month: string
}

export function MovementsPanel({ transactions, categories, month: monthStr }: MovementsPanelProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [csvConfirmOpen, setCsvConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const month = useMemo(() => new Date(`${monthStr}-01T12:00:00`), [monthStr])

  const rows = useMemo(
    () =>
      typeFilter === "all"
        ? transactions
        : transactions.filter((t) => t.type === typeFilter),
    [transactions, typeFilter]
  )

  const csvMonthLabel = format(month, "MMMM yyyy", { locale: es })
  const csvFrom = format(startOfMonth(month), "d 'de' MMMM", { locale: es })
  const csvTo = format(endOfMonth(month), "d 'de' MMMM yyyy", { locale: es })
  const csvFilename = `gastly-transacciones-${format(month, "yyyy-MM")}.csv`

  const totals = rows.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += t.amount
      else acc.expense += t.amount
      return acc
    },
    { income: 0, expense: 0 }
  )
  const incomeCount = rows.filter((t) => t.type === "income").length
  const expenseCount = rows.length - incomeCount

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteTransaction(id)
        toast.success("Transacción eliminada")
        setDeleteId(null)
      } catch (error) {
        toast.error("No se pudo eliminar la transacción", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  const columns = useMemo<ColumnDef<DataTableFeatures, Transaction>[]>(
    () => createMovementsColumns({ onEdit: setEditTransaction, onDelete: setDeleteId }),
    []
  )

  const addLabel = transactionAddLabel(typeFilter)

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Transacciones
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona todos tus ingresos y gastos en un solo lugar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav value={month} allowFuture />
          <Button
            variant="outline"
            disabled={rows.length === 0}
            onClick={() => setCsvConfirmOpen(true)}
          >
            <DownloadIcon />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <CreateTransactionDialog
            categories={categories}
            defaultType={typeFilter === "income" ? "income" : "expense"}
            lockType={typeFilter !== "all"}
            triggerLabel={addLabel}
          />
        </div>
      </section>

      {rows.length > 0 && (
        <MovementsSummaryCards
          income={totals.income}
          expense={totals.expense}
          incomeCount={incomeCount}
          expenseCount={expenseCount}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{movementsCardTitle(typeFilter)}</CardTitle>
          <CardDescription>
            {rows.length} registro{rows.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rows}
            searchPlaceholder="Buscar por descripción o categoría..."
            toolbar={
              <SegmentedControl value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
            }
            emptyState={<MovementsEmptyState typeFilter={typeFilter} categories={categories} />}
          />
        </CardContent>
      </Card>

      {editTransaction && (
        <EditTransactionDialog
          transaction={editTransaction}
          categories={categories}
          open={Boolean(editTransaction)}
          onOpenChange={(o) => !o && setEditTransaction(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        description="Se eliminará esta transacción permanentemente."
        pending={isPending}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
      <CsvExportConfirmDialog
        open={csvConfirmOpen}
        onOpenChange={setCsvConfirmOpen}
        title="Exportar transacciones"
        description={`Se descargará un archivo CSV con ${rows.length} transacción${rows.length !== 1 ? "es" : ""} del ${csvFrom} al ${csvTo} (${csvMonthLabel}).`}
        onConfirm={() => exportTransactionsToCSV(rows, csvFilename)}
      />
    </main>
  )
}
