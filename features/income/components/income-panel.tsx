"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CircleDollarSignIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable } from "@/components/ui/data-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { TransactionDialog } from "@/features/transactions/components/transaction-dialog"
import { MonthNav } from "@/features/transactions/components/month-nav"
import {
  deleteTransaction,
  getTransactions,
} from "@/features/transactions/lib/transactions-api"
import {
  formatCurrency,
  formatDate,
} from "@/features/transactions/lib/format-transaction"
import { type Transaction } from "@/features/transactions/types/transaction-types"

export function IncomePanel() {
  const [month, setMonth] = useState(() => new Date())
  const queryClient = useQueryClient()

  const incomeQuery = useQuery({
    queryKey: ["transactions", "income", month.toISOString().slice(0, 7)],
    queryFn: () => getTransactions({ type: "income", month }),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["category-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
      ])
      toast.success("Ingreso eliminado")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar", { description: error.message })
    },
  })

  const income = incomeQuery.data ?? []
  const total = income.reduce((sum, i) => sum + i.amount, 0)

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("description")}</span>
        ),
      },
      {
        accessorFn: (row) => row.category?.name ?? "Sin categoría",
        id: "category",
        header: "Categoría",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
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
        header: () => <div className="text-right">Monto</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(row.getValue("amount"))}
          </div>
        ),
      },
      {
        id: "actions",
        size: 80,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center justify-end gap-1">
              <TransactionDialog
                transaction={item}
                trigger={
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <PencilIcon className="size-3.5" />
                    <span className="sr-only">Editar</span>
                  </Button>
                }
              />
              <ConfirmDialog
                trigger={
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2Icon className="size-3.5" />
                    <span className="sr-only">Eliminar</span>
                  </Button>
                }
                description="Se eliminará este ingreso permanentemente."
                onConfirm={() => deleteMutation.mutate(item.id)}
              />
            </div>
          )
        },
      },
    ],
    [deleteMutation] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Ingresos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra y revisa todos tus entradas de dinero.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav value={month} onChange={setMonth} />
          <TransactionDialog
            defaultType="income"
            lockType
            triggerLabel="Nuevo ingreso"
          />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingresos del mes</CardTitle>
          <CardDescription>
            {income.length} registro{income.length !== 1 ? "s" : ""} ·{" "}
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(total)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={income}
            isLoading={incomeQuery.isLoading}
            searchPlaceholder="Buscar por descripción o categoría..."
            emptyState={
              <Empty className="bg-muted/20">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CircleDollarSignIcon />
                  </EmptyMedia>
                  <EmptyTitle>Sin ingresos este mes</EmptyTitle>
                  <EmptyDescription>
                    Registra tu primer ingreso para comenzar a controlar tus entradas.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <TransactionDialog
                    defaultType="income"
                    lockType
                    triggerLabel="Agregar ingreso"
                  />
                </EmptyContent>
              </Empty>
            }
          />
        </CardContent>
      </Card>
    </main>
  )
}
