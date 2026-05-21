"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PencilIcon, Trash2Icon, WalletCardsIcon } from "lucide-react"
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MonthNav } from "@/features/transactions/components/month-nav"
import { TransactionDialog } from "@/features/transactions/components/transaction-dialog"
import {
  deleteTransaction,
  getTransactions,
} from "@/features/transactions/lib/transactions-api"
import {
  formatCurrency,
  formatDate,
} from "@/features/transactions/lib/format-transaction"
import { type Transaction } from "@/features/transactions/types/transaction-types"
import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"

type Tab = "all" | "expense" | "income"

const TAB_CONFIG: Record<
  Tab,
  { label: string; type?: TransactionType; emptyTitle: string; emptyDesc: string }
> = {
  all: {
    label: "Todos",
    emptyTitle: "Sin movimientos este mes",
    emptyDesc: "Registra tu primer ingreso o gasto para ver el resumen.",
  },
  expense: {
    label: "Gastos",
    type: "expense",
    emptyTitle: "Sin gastos este mes",
    emptyDesc: "Registra tu primer gasto para empezar a controlar tus egresos.",
  },
  income: {
    label: "Ingresos",
    type: "income",
    emptyTitle: "Sin ingresos este mes",
    emptyDesc: "Registra tu primer ingreso para controlar tus entradas.",
  },
}

function useMovements(type: TransactionType | undefined, month: Date) {
  return useQuery({
    queryKey: ["transactions", type ?? "all", month.toISOString().slice(0, 7)],
    queryFn: () => getTransactions({ type, month }),
  })
}

function MovementsTable({
  tab,
  month,
}: {
  tab: Tab
  month: Date
}) {
  const queryClient = useQueryClient()
  const config = TAB_CONFIG[tab]

  const query = useMovements(config.type, month)
  const rows = query.data ?? []

  const total = rows.reduce(
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
        cell: ({ row }) => {
          const t = row.original
          return (
            <div
              className={`text-right font-medium ${
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
        size: 80,
        cell: ({ row }) => {
          const t = row.original
          return (
            <div className="flex items-center justify-end gap-1">
              <TransactionDialog
                transaction={t}
                trigger={
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <PencilIcon />
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
                    <Trash2Icon />
                    <span className="sr-only">Eliminar</span>
                  </Button>
                }
                description="Se eliminará este movimiento permanentemente."
                onConfirm={() => deleteMutation.mutate(t.id)}
              />
            </div>
          )
        },
      },
    ],
    [deleteMutation] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {tab === "all" ? "Todos los movimientos" : tab === "expense" ? "Gastos" : "Ingresos"}
        </CardTitle>
        <CardDescription className="flex flex-wrap gap-3">
          <span>{rows.length} registro{rows.length !== 1 ? "s" : ""}</span>
          {(tab === "all" || tab === "income") && total.income > 0 && (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(total.income)}
            </span>
          )}
          {(tab === "all" || tab === "expense") && total.expense > 0 && (
            <span className="font-medium text-destructive">
              -{formatCurrency(total.expense)}
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
          emptyState={
            <Empty className="bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <WalletCardsIcon />
                </EmptyMedia>
                <EmptyTitle>{config.emptyTitle}</EmptyTitle>
                <EmptyDescription>{config.emptyDesc}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <TransactionDialog
                  defaultType={config.type ?? "expense"}
                  lockType={!!config.type}
                  triggerLabel={
                    config.type === "income" ? "Agregar ingreso" : "Agregar gasto"
                  }
                />
              </EmptyContent>
            </Empty>
          }
        />
      </CardContent>
    </Card>
  )
}

export function MovementsPanel() {
  const [month, setMonth] = useState(() => new Date())
  const [tab, setTab] = useState<Tab>("all")

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
            defaultType={tab === "income" ? "income" : "expense"}
            lockType={tab !== "all"}
            triggerLabel={
              tab === "income"
                ? "Nuevo ingreso"
                : tab === "expense"
                  ? "Nuevo gasto"
                  : "Nuevo movimiento"
            }
          />
        </div>
      </section>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          {(Object.entries(TAB_CONFIG) as [Tab, (typeof TAB_CONFIG)[Tab]][]).map(
            ([key, cfg]) => (
              <TabsTrigger key={key} value={key}>
                {cfg.label}
              </TabsTrigger>
            )
          )}
        </TabsList>

        {(Object.keys(TAB_CONFIG) as Tab[]).map((key) => (
          <TabsContent key={key} value={key} className="mt-4">
            <MovementsTable tab={key} month={month} />
          </TabsContent>
        ))}
      </Tabs>
    </main>
  )
}
