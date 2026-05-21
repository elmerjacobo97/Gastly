"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  Trash2Icon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  getCategoryTotals,
  getMonthlyTotals,
} from "@/features/transactions/lib/charts-api"
import {
  computeSummary,
  deleteTransaction,
  getTransactions,
} from "@/features/transactions/lib/transactions-api"
import {
  formatCurrency,
  formatDate,
} from "@/features/transactions/lib/format-transaction"
import { TransactionDialog } from "@/features/transactions/components/transaction-dialog"
import { MonthNav } from "@/features/transactions/components/month-nav"

type TransactionsPanelProps = {
  userEmail?: string
}

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

function formatCompact(value: number) {
  if (value >= 1000) return `S/ ${(value / 1000).toFixed(1)}k`
  return `S/ ${value.toFixed(0)}`
}

export function TransactionsPanel({ userEmail }: TransactionsPanelProps) {
  const [month, setMonth] = useState(() => new Date())
  const queryClient = useQueryClient()

  const transactionsQuery = useQuery({
    queryKey: ["transactions", month.toISOString().slice(0, 7)],
    queryFn: () => getTransactions({ month }),
  })
  const monthlyQuery = useQuery({
    queryKey: ["monthly-totals"],
    queryFn: () => getMonthlyTotals(6),
  })
  const categoryQuery = useQuery({
    queryKey: ["category-totals", month.toISOString().slice(0, 7)],
    queryFn: () => getCategoryTotals(month),
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
      toast.success("Movimiento eliminado")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar", { description: error.message })
    },
  })

  const transactions = transactionsQuery.data ?? []
  const summary = computeSummary(transactions)

  const columns = useMemo<ColumnDef<(typeof transactions)[0]>[]>(
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

  const summaryCards = [
    {
      title: "Balance del mes",
      value: formatCurrency(summary.balance),
      description: summary.balance >= 0 ? "Saldo positivo" : "Gastos superan ingresos",
      icon: WalletCardsIcon,
      positive: summary.balance >= 0,
    },
    {
      title: "Ingresos",
      value: formatCurrency(summary.income),
      description: "Total del mes",
      icon: ArrowUpIcon,
      positive: true,
    },
    {
      title: "Gastos",
      value: formatCurrency(summary.expenses),
      description: "Total del mes",
      icon: ArrowDownIcon,
      positive: false,
    },
    {
      title: "Uso del ingreso",
      value: `${summary.budgetUsage}%`,
      description: "Gastos sobre ingresos",
      icon: TrendingUpIcon,
      positive: summary.budgetUsage < 80,
    },
  ]

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <Badge className="w-fit" variant="secondary">
            Cuenta activa
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Hola, {userEmail?.split("@")[0] ?? "Usuario"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen de tus finanzas personales.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav value={month} onChange={setMonth} />
          <TransactionDialog />
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {transactionsQuery.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-7 w-28" />
                  </div>
                  <Skeleton className="size-10 rounded-xl" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))
          : summaryCards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <div>
                    <CardDescription className="text-xs">
                      {card.title}
                    </CardDescription>
                    <CardTitle
                      className={`mt-1.5 text-2xl ${
                        card.positive ? "text-foreground" : "text-destructive"
                      }`}
                    >
                      {card.value}
                    </CardTitle>
                  </div>
                  <div
                    className={`grid size-10 place-items-center rounded-xl ${
                      card.positive
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    <card.icon className="size-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos 6 meses</CardTitle>
            <CardDescription>Ingresos vs gastos por mes</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyQuery.isLoading ? (
              <Skeleton className="h-52 w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={monthlyQuery.data}
                  margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatCompact}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      formatCurrency(Number(val)),
                      name === "income" ? "Ingresos" : "Gastos",
                    ]}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--popover-foreground)",
                      fontSize: 13,
                    }}
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  />
                  <Bar
                    dataKey="income"
                    fill="var(--color-chart-1)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="var(--color-chart-2)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div
                  className="size-2.5 rounded-sm"
                  style={{ background: "var(--color-chart-1)" }}
                />
                Ingresos
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="size-2.5 rounded-sm"
                  style={{ background: "var(--color-chart-2)" }}
                />
                Gastos
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos por categoría</CardTitle>
            <CardDescription>Top categorías del mes seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryQuery.isLoading ? (
              <Skeleton className="h-52 w-full rounded-lg" />
            ) : categoryQuery.data && categoryQuery.data.length > 0 ? (
              <div className="flex flex-col gap-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={categoryQuery.data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryQuery.data.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [formatCurrency(Number(val))]}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--popover-foreground)",
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {categoryQuery.data.map((cat, i) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="size-2.5 shrink-0 rounded-sm"
                          style={{
                            background: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                        <span className="text-muted-foreground">{cat.name}</span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(cat.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                Sin gastos este mes
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Transactions table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimientos</CardTitle>
          <CardDescription>
            {transactions.length} registro{transactions.length !== 1 ? "s" : ""} este mes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={transactions}
            isLoading={transactionsQuery.isLoading}
            searchPlaceholder="Buscar por descripción o categoría..."
            emptyState={
              <Empty className="bg-muted/20">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <WalletCardsIcon />
                  </EmptyMedia>
                  <EmptyTitle>Sin movimientos este mes</EmptyTitle>
                  <EmptyDescription>
                    Registra tu primer gasto o ingreso para ver el resumen.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <TransactionDialog />
                </EmptyContent>
              </Empty>
            }
          />
        </CardContent>
      </Card>
    </main>
  )
}
