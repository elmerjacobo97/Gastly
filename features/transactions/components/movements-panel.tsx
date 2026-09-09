"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DownloadIcon,
  ScaleIcon,
  WalletCardsIcon,
} from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable, type DataTableFeatures } from "@/components/ui/data-table"
import { CsvExportConfirmDialog } from "@/components/csv-export-confirm-dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { MonthNav } from "@/components/month-nav"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { CategoryIconBadge } from "@/components/category-icon-badge"
import { RowActionsMenu } from "@/components/row-actions-menu"
import { CreateTransactionDialog } from "@/components/create-transaction-dialog"
import { EditTransactionDialog } from "@/features/transactions/components/edit-transaction-dialog"
import { deleteTransaction } from "@/features/transactions/server/actions"
import { type Transaction } from "@/features/transactions/types/transaction-types"
import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"
import { formatCurrency, formatDate } from "@/lib/format"
import { type Category } from "@/features/categories/types/category-types"

function exportToCSV(transactions: Transaction[], filename: string) {
  const headers = ["Fecha", "Tipo", "Descripción", "Categoría", "Monto", "Método de pago", "Notas"]
  const rows = transactions.map((t) => [
    t.occurredOn,
    t.type === "expense" ? "Gasto" : "Ingreso",
    t.description,
    t.category?.name ?? "Sin categoría",
    t.amount.toString(),
    t.paymentMethod === "credit_card"
      ? `TC${t.creditCardName ? ` (${t.creditCardName})` : ""}`
      : "Efectivo",
    t.notes ?? "",
  ])
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

type TypeFilter = "all" | TransactionType

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
]

function transactionAddLabel(typeFilter: TypeFilter) {
  if (typeFilter === "income") return "Nuevo ingreso"
  if (typeFilter === "expense") return "Nuevo gasto"
  return "Nueva transacción"
}

function movementsCardTitle(typeFilter: TypeFilter) {
  if (typeFilter === "all") return "Todas las transacciones"
  return typeFilter === "expense" ? "Gastos" : "Ingresos"
}

function TransactionDescriptionCell({ transaction }: { transaction: Transaction }) {
  const isCreditCard = transaction.paymentMethod === "credit_card"
  const isPendingCC = isCreditCard && !transaction.creditCardPaidOn

  return (
    <div className="flex flex-col">
      <span className="font-medium">{transaction.description}</span>
      {isCreditCard && (
        <span className={`text-xs ${isPendingCC ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
          TC{transaction.creditCardName ? ` · ${transaction.creditCardName}` : ""}
          {isPendingCC ? " · Por pagar" : " · Pagado"}
        </span>
      )}
      {transaction.notes && (
        <span className="truncate text-xs text-muted-foreground">{transaction.notes}</span>
      )}
    </div>
  )
}

function TransactionAmountCell({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === "income"
  return (
    <div
      className={`text-right font-medium tabular-nums ${
        isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
      }`}
    >
      {isIncome ? "+" : "-"}
      {formatCurrency(transaction.amount)}
    </div>
  )
}

function MovementsSummaryCards({
  totals,
  diff,
  incomeCount,
  expenseCount,
}: {
  totals: { income: number; expense: number }
  diff: number
  incomeCount: number
  expenseCount: number
}) {
  const cards = [
    { label: "Ingresos", amount: totals.income, icon: ArrowUpIcon, positive: true, count: incomeCount },
    { label: "Gastos", amount: totals.expense, icon: ArrowDownIcon, positive: false, count: expenseCount },
    { label: "Diferencia", amount: diff, icon: ScaleIcon, positive: diff >= 0, count: null },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map(({ label, amount, icon: Icon, positive, count }) => (
        <div key={label} className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
          <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${positive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
            {count !== null && <p className="truncate text-xs text-muted-foreground">{count} registro{count !== 1 ? "s" : ""}</p>}
          </div>
          <p className={`text-lg font-semibold tabular-nums ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
            {label === "Diferencia" && diff >= 0 ? "+" : ""}{formatCurrency(amount)}
          </p>
        </div>
      ))}
    </div>
  )
}

function MovementsEmptyState({
  typeFilter,
  categories,
}: {
  typeFilter: TypeFilter
  categories: Category[]
}) {
  const isIncome = typeFilter === "income"
  const isExpense = typeFilter === "expense"

  return (
    <Empty className="bg-muted/20">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WalletCardsIcon />
        </EmptyMedia>
        <EmptyTitle>
          {isIncome ? "Sin ingresos este mes" : isExpense ? "Sin gastos este mes" : "Sin transacciones este mes"}
        </EmptyTitle>
        <EmptyDescription>
          {isIncome
            ? "Registra tu primer ingreso para controlar tus entradas."
            : isExpense
              ? "Registra tu primer gasto para controlar tus egresos."
              : "Registra tu primer ingreso o gasto para ver el resumen."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <CreateTransactionDialog
          categories={categories}
          defaultType={isIncome ? "income" : "expense"}
          lockType={typeFilter !== "all"}
          triggerLabel={transactionAddLabel(typeFilter)}
        />
      </EmptyContent>
    </Empty>
  )
}

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
  const diff = totals.income - totals.expense

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
    () => [
      {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => <TransactionDescriptionCell transaction={row.original} />,
      },
      {
        accessorFn: (row) => row.category?.name ?? "Sin categoría",
        id: "category",
        header: "Categoría",
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-2 text-muted-foreground">
            {row.original.category && (
              <CategoryIconBadge
                icon={row.original.category.icon}
                color={row.original.category.color}
                className="size-6 rounded-md"
              />
            )}
            <span>{getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: "occurredOn",
        header: "Fecha",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.getValue("occurredOn"))}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        enableSorting: false,
        header: () => <div className="text-right">Monto</div>,
        cell: ({ row }) => <TransactionAmountCell transaction={row.original} />,
      },
      {
        id: "actions",
        size: 48,
        cell: ({ row }) => {
          const t = row.original
          return (
            <div className="flex justify-end">
              <RowActionsMenu
                onEdit={() => setEditTransaction(t)}
                onDelete={() => setDeleteId(t.id)}
                className="text-muted-foreground data-[state=open]:bg-muted"
              />
            </div>
          )
        },
      },
    ],
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
          totals={totals}
          diff={diff}
          incomeCount={rows.filter((t) => t.type === "income").length}
          expenseCount={rows.filter((t) => t.type === "expense").length}
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
        onConfirm={() => exportToCSV(rows, csvFilename)}
      />
    </main>
  )
}
