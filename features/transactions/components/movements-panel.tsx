"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  WalletCardsIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable } from "@/components/ui/data-table"
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
import { CategoryIconBadge } from "@/features/categories/components/category-icon"
import { TransactionDialog } from "@/features/transactions/components/transaction-dialog"
import {
  deleteTransaction,
  getTransactions,
} from "@/features/transactions/lib/transactions-api"
import {
  formatCurrency,
  formatDate,
} from "@/lib/format"
import { type Transaction } from "@/features/transactions/types/transaction-types"
import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"
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
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["transactions", typeFilter, month.toISOString().slice(0, 7)],
    queryFn: () =>
      getTransactions({
        type: typeFilter === "all" ? undefined : typeFilter,
        month,
      }),
  })

  const rows = query.data ?? []

  const totals = rows.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += t.amount
      else acc.expense += t.amount
      return acc
    },
    { income: 0, expense: 0 }
  )

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      setDeleteId(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["category-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
      ])
      toast.success("Movimiento eliminado")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar", { description: error.message })
    },
  })

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => {
          const t = row.original
          return (
            <div className="flex flex-col">
              <span className="font-medium">{t.description}</span>
              {t.notes && (
                <span className="text-xs text-muted-foreground">{t.notes}</span>
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
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const addLabel =
    typeFilter === "income"
      ? "Nuevo ingreso"
      : typeFilter === "expense"
        ? "Nuevo gasto"
        : "Nuevo movimiento"

  const cardTitle =
    typeFilter === "all"
      ? "Todos los movimientos"
      : typeFilter === "expense"
        ? "Gastos"
        : "Ingresos"

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Movimientos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona todos tus ingresos y gastos en un solo lugar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav value={month} onChange={setMonth} />
          <TransactionDialog
            defaultType={typeFilter === "income" ? "income" : "expense"}
            lockType={typeFilter !== "all"}
            triggerLabel={addLabel}
          />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{cardTitle}</CardTitle>
          <CardDescription className="flex flex-wrap gap-3">
            <span>
              {rows.length} registro{rows.length !== 1 ? "s" : ""}
            </span>
            {(typeFilter === "all" || typeFilter === "income") &&
              totals.income > 0 && (
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(totals.income)}
                </span>
              )}
            {(typeFilter === "all" || typeFilter === "expense") &&
              totals.expense > 0 && (
                <span className="font-medium text-destructive">
                  -{formatCurrency(totals.expense)}
                </span>
              )}
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
                        : "Sin movimientos este mes"}
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
                  <TransactionDialog
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

      <TransactionDialog
        transaction={editTransaction ?? undefined}
        open={!!editTransaction}
        onOpenChange={(o) => !o && setEditTransaction(null)}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        description="Se eliminará este movimiento permanentemente."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </main>
  )
}
