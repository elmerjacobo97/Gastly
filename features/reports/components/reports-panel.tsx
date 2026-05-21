"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  DownloadIcon,
  PrinterIcon,
  FilterIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  ScaleIcon,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { getAllTransactions } from "@/features/transactions/lib/charts-api"
import {
  formatCurrency,
  formatDate,
} from "@/features/transactions/lib/format-transaction"

type FilterType = "all" | "expense" | "income"

function exportToCSV(
  transactions: Awaited<ReturnType<typeof getAllTransactions>>,
  filename: string
) {
  const headers = [
    "Fecha",
    "Tipo",
    "Descripción",
    "Categoría",
    "Monto",
    "Notas",
  ]
  const rows = transactions.map((t) => [
    t.occurredOn,
    t.type === "expense" ? "Gasto" : "Ingreso",
    t.description,
    t.category?.name ?? "Sin categoría",
    t.amount.toString(),
    t.notes ?? "",
  ])

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  const blob = new Blob(["﻿" + csvContent], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function ReportsPanel() {
  const [filterType, setFilterType] = useState<FilterType>("all")

  const today = new Date()
  const fromDate = format(new Date(today.getFullYear(), today.getMonth() - 2, 1), "yyyy-MM-dd")
  const toDate = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), "yyyy-MM-dd")

  const transactionsQuery = useQuery({
    queryKey: ["report-transactions", fromDate, toDate],
    queryFn: () => getAllTransactions({ from: fromDate, to: toDate }),
  })

  const all = transactionsQuery.data ?? []
  const filtered =
    filterType === "all" ? all : all.filter((t) => t.type === filterType)

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
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            <PrinterIcon className="size-4" />
            Imprimir / PDF
          </Button>
          <Button
            onClick={() => exportToCSV(filtered, filename)}
            disabled={filtered.length === 0}
          >
            <DownloadIcon className="size-4" />
            Exportar CSV
          </Button>
        </div>
      </section>

      {/* Summary */}
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

      {/* Filter + table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between print:pb-2">
          <div>
            <CardTitle className="text-base">Movimientos</CardTitle>
            <CardDescription>
              {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex gap-1 print:hidden">
            <Button
              size="sm"
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => setFilterType("all")}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={filterType === "expense" ? "default" : "outline"}
              onClick={() => setFilterType("expense")}
            >
              Gastos
            </Button>
            <Button
              size="sm"
              variant={filterType === "income" ? "default" : "outline"}
              onClick={() => setFilterType("income")}
            >
              Ingresos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactionsQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(t.occurredOn)}
                    </TableCell>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.category?.name ?? "Sin categoría"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={t.type === "income" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {t.type === "income" ? "Ingreso" : "Gasto"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          t.type === "income"
                            ? "font-medium text-emerald-600 dark:text-emerald-400"
                            : "font-medium text-destructive"
                        }
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FilterIcon />
                </EmptyMedia>
                <EmptyTitle>Sin movimientos</EmptyTitle>
                <EmptyDescription>
                  No hay registros para los filtros seleccionados.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
