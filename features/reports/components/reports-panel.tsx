"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import {
  DownloadIcon,
  FilterIcon,
  PrinterIcon,
  ScaleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllTransactions } from "@/features/transactions/lib/charts-api"
import {
  formatCurrency,
  formatDate,
} from "@/features/transactions/lib/format-transaction"
import { type Transaction } from "@/features/transactions/types/transaction-types"
import { cn } from "@/lib/utils"

type FilterType = "all" | "expense" | "income"

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
]

function TypeFilterBar({
  value,
  onChange,
}: {
  value: FilterType
  onChange: (v: FilterType) => void
}) {
  return (
    <div className="flex rounded-md border p-0.5 gap-0.5 print:hidden">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            opt.value === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function exportToCSV(transactions: Transaction[], filename: string) {
  const headers = ["Fecha", "Tipo", "Descripción", "Categoría", "Monto", "Notas"]
  const rows = transactions.map((t) => [
    t.occurredOn,
    t.type === "expense" ? "Gasto" : "Ingreso",
    t.description,
    t.category?.name ?? "Sin categoría",
    t.amount.toString(),
    t.notes ?? "",
  ])

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
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

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "occurredOn",
    header: "Fecha",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {formatDate(row.getValue("occurredOn"))}
      </span>
    ),
  },
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
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      return (
        <Badge variant={type === "income" ? "default" : "secondary"} className="text-xs">
          {type === "income" ? "Ingreso" : "Gasto"}
        </Badge>
      )
    },
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
]

function ReportsTable({
  all,
  isLoading,
  filename,
}: {
  all: Transaction[]
  isLoading: boolean
  filename: string
}) {
  const [filterType, setFilterType] = useState<FilterType>("all")
  const filtered = filterType === "all" ? all : all.filter((t) => t.type === filterType)

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">Movimientos</CardTitle>
          <CardDescription>
            {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="print:hidden"
          onClick={() => exportToCSV(filtered, filename)}
          disabled={filtered.length === 0}
        >
          <DownloadIcon />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          defaultPageSize={20}
          searchPlaceholder="Buscar por descripción o categoría..."
          toolbar={<TypeFilterBar value={filterType} onChange={setFilterType} />}
          emptyState={
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FilterIcon />
                </EmptyMedia>
                <EmptyTitle>Sin movimientos</EmptyTitle>
                <EmptyDescription>
                  No hay registros para el período seleccionado.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          }
        />
      </CardContent>
    </Card>
  )
}

export function ReportsPanel() {
  const today = new Date()
  const fromDate = format(
    new Date(today.getFullYear(), today.getMonth() - 2, 1),
    "yyyy-MM-dd"
  )
  const toDate = format(
    new Date(today.getFullYear(), today.getMonth() + 1, 0),
    "yyyy-MM-dd"
  )

  const transactionsQuery = useQuery({
    queryKey: ["report-transactions", fromDate, toDate],
    queryFn: () => getAllTransactions({ from: fromDate, to: toDate }),
  })

  const all = transactionsQuery.data ?? []
  const totalIncome = all
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0)
  const totalExpenses = all
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpenses

  const monthLabel = format(today, "MMMM yyyy", { locale: es })
  const filename = `gastly-reporte-${format(today, "yyyy-MM")}.csv`

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 print:p-0">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between print:rounded-none print:border-0 print:shadow-none">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Reporte
          </h1>
          <p className="mt-1 text-sm text-muted-foreground capitalize">
            {monthLabel} · Últimos 3 meses
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            <PrinterIcon />
            Imprimir / PDF
          </Button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {transactionsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-7 w-28" />
            </Card>
          ))
        ) : (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUpIcon className="size-3.5 text-emerald-500" />
                Total ingresos
              </div>
              <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalIncome)}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingDownIcon className="size-3.5 text-destructive" />
                Total gastos
              </div>
              <p className="mt-1 text-xl font-semibold text-destructive">
                {formatCurrency(totalExpenses)}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ScaleIcon className="size-3.5" />
                Balance neto
              </div>
              <p
                className={`mt-1 text-xl font-semibold ${
                  balance >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                }`}
              >
                {formatCurrency(balance)}
              </p>
            </Card>
          </>
        )}
      </div>

      <ReportsTable all={all} isLoading={transactionsQuery.isLoading} filename={filename} />
    </main>
  )
}
