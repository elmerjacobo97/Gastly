"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  ScaleIcon,
  Trash2Icon,
  WalletCardsIcon,
  AlertTriangleIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable, type DataTableFeatures } from "@/components/ui/data-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { CreateTransactionDialog } from "@/components/create-transaction-dialog"
import { EditTransactionDialog } from "@/features/transactions/components/edit-transaction-dialog"
import { useTransactions } from "@/lib/finance/transactions/hooks/queries"
import { useDeleteTransaction } from "@/lib/finance/transactions/hooks/mutations"
import {
  formatCurrency,
  formatDate,
} from "@/lib/format"
import { type Transaction } from "@/lib/finance/transactions/types/transaction-types"
import { type TransactionType } from "@/lib/finance/transactions/schemas/transaction-schemas"

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

export function MovementsPanel() {
  const [month, setMonth] = useState(() => new Date())
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [csvConfirmOpen, setCsvConfirmOpen] = useState(false)

  const query = useTransactions({
    type: typeFilter === "all" ? undefined : typeFilter,
    month,
  })

  const rows = query.data ?? []
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

  const deleteMutation = useDeleteTransaction()

  const columns = useMemo<ColumnDef<DataTableFeatures, Transaction>[]>(
    () => [
      {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => {
          const t = row.original
          const isCreditCard = t.paymentMethod === "credit_card"
          const isPendingCC = isCreditCard && !t.creditCardPaidOn
          return (
            <div className="flex flex-col">
              <span className="font-medium">{t.description}</span>
              {isCreditCard && (
                <span className={`text-xs ${isPendingCC ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                  TC{t.creditCardName ? ` · ${t.creditCardName}` : ""}
                  {isPendingCC ? " · Por pagar" : " · Pagado"}
                </span>
              )}
              {t.notes && (
                <span className="truncate text-xs text-muted-foreground">{t.notes}</span>
              )}
            </div>
          )
        },
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
        cell: ({ row }) => {
          const t = row.original
          return (
            <div
              className={`text-right font-medium tabular-nums ${
                t.type === "income"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              }`}
            >
              {t.type === "income" ? "+" : "-"}
              {formatCurrency(t.amount)}
            </div>
          )
        },
      },
      {
        id: "actions",
        size: 48,
        cell: ({ row }) => {
          const t = row.original
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground data-[state=open]:bg-muted"
                  >
                    <MoreHorizontalIcon />
                    <span className="sr-only">Acciones</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditTransaction(t)}>
                    <PencilIcon />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setDeleteId(t.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2Icon />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    []
  )

  const addLabel =
    typeFilter === "income"
      ? "Nuevo ingreso"
      : typeFilter === "expense"
        ? "Nuevo gasto"
        : "Nueva transacción"

  const cardTitle =
    typeFilter === "all"
      ? "Todas las transacciones"
      : typeFilter === "expense"
        ? "Gastos"
        : "Ingresos"

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
          <MonthNav value={month} onChange={setMonth} allowFuture />
          <Button
            variant="outline"
            disabled={rows.length === 0}
            onClick={() => setCsvConfirmOpen(true)}
          >
            <DownloadIcon />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <CreateTransactionDialog
            defaultType={typeFilter === "income" ? "income" : "expense"}
            lockType={typeFilter !== "all"}
            triggerLabel={addLabel}
          />
        </div>
      </section>

      {query.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudieron cargar las transacciones</AlertTitle>
          <AlertDescription>
            {query.error instanceof Error
              ? query.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {rows.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Ingresos", amount: totals.income, icon: ArrowUpIcon, color: "emerald", count: rows.filter((t) => t.type === "income").length },
            { label: "Gastos", amount: totals.expense, icon: ArrowDownIcon, color: "red", count: rows.filter((t) => t.type === "expense").length },
            { label: "Diferencia", amount: diff, icon: ScaleIcon, color: diff >= 0 ? "emerald" : "red", count: null },
          ].map(({ label, amount, icon: Icon, color, count }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
              <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${color === "emerald" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
                {count !== null && <p className="truncate text-xs text-muted-foreground">{count} registro{count !== 1 ? "s" : ""}</p>}
              </div>
              <p className={`text-lg font-semibold tabular-nums ${color === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {label === "Diferencia" && diff >= 0 ? "+" : ""}{formatCurrency(amount)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{cardTitle}</CardTitle>
          <CardDescription>
            {rows.length} registro{rows.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rows}
            isLoading={query.isLoading}
            searchPlaceholder="Buscar por descripción o categoría..."
            toolbar={
              <SegmentedControl value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
            }
            emptyState={
              <Empty className="bg-muted/20">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <WalletCardsIcon />
                  </EmptyMedia>
                  <EmptyTitle>
                    {typeFilter === "income"
                      ? "Sin ingresos este mes"
                      : typeFilter === "expense"
                        ? "Sin gastos este mes"
                        : "Sin transacciones este mes"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {typeFilter === "income"
                      ? "Registra tu primer ingreso para controlar tus entradas."
                      : typeFilter === "expense"
                        ? "Registra tu primer gasto para controlar tus egresos."
                        : "Registra tu primer ingreso o gasto para ver el resumen."}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <CreateTransactionDialog
                    defaultType={typeFilter === "income" ? "income" : "expense"}
                    lockType={typeFilter !== "all"}
                    triggerLabel={addLabel}
                  />
                </EmptyContent>
              </Empty>
            }
          />
        </CardContent>
      </Card>

      {editTransaction && (
        <EditTransactionDialog
          transaction={editTransaction}
          open={!!editTransaction}
          onOpenChange={(o) => !o && setEditTransaction(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        description="Se eliminará esta transacción permanentemente."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
      <AlertDialog open={csvConfirmOpen} onOpenChange={setCsvConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exportar transacciones</AlertDialogTitle>
            <AlertDialogDescription>
              Se descargará un archivo CSV con {rows.length} transacción{rows.length !== 1 ? "es" : ""} del {csvFrom} al {csvTo} ({csvMonthLabel}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => exportToCSV(rows, csvFilename)}>
              Descargar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
