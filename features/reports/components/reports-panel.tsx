"use client"

import { useState } from "react"
import { DownloadIcon, PrinterIcon } from "lucide-react"
import {
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { CsvExportConfirmDialog } from "@/components/csv-export-confirm-dialog"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { calculateSavings } from "@/features/monthly-plan/lib/monthly-plan-api"
import { type MonthlyPlan } from "@/features/monthly-plan/types/monthly-plan-types"
import { type Transaction } from "@/features/transactions/types/transaction-types"
import {
  ReportsVisuals,
  type ReportTypeFilter,
} from "@/features/reports/components/reports-visuals"

type Period = "1m" | "3m" | "6m" | "year" | "last-year"

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "1m", label: "Este mes" },
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "year", label: "Este año" },
  { value: "last-year", label: "Año pasado" },
]

function getPeriodDates(period: Period): { from: string; to: string; label: string } {
  const today = new Date()
  switch (period) {
    case "1m":
      return { from: format(startOfMonth(today), "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd"), label: format(today, "MMMM yyyy", { locale: es }) }
    case "3m":
      return { from: format(startOfMonth(subMonths(today, 2)), "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd"), label: "Últimos 3 meses" }
    case "6m":
      return { from: format(startOfMonth(subMonths(today, 5)), "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd"), label: "Últimos 6 meses" }
    case "year":
      return { from: format(startOfYear(today), "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd"), label: `Año ${today.getFullYear()}` }
    case "last-year": {
      const lastYear = new Date(today.getFullYear() - 1, 0, 1)
      return { from: format(startOfYear(lastYear), "yyyy-MM-dd"), to: format(endOfYear(lastYear), "yyyy-MM-dd"), label: `Año ${today.getFullYear() - 1}` }
    }
  }
}

function computeMonthlyData(transactions: Transaction[]) {
  const map: Record<string, { income: number; expenses: number }> = {}
  for (const transaction of transactions) {
    const key = transaction.occurredOn.slice(0, 7)
    const entry = map[key] ?? { income: 0, expenses: 0 }
    if (transaction.type === "income") entry.income += transaction.amount
    else entry.expenses += transaction.amount
    map[key] = entry
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([key, data]) => ({
    month: format(new Date(`${key}-15`), "MMM", { locale: es }),
    ...data,
  }))
}

function computeCategoryBreakdown(transactions: Transaction[]) {
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  const map: Record<string, { amount: number; color: string; icon: string }> = {}
  for (const transaction of transactions) {
    const name = transaction.category?.name ?? "Sin categoría"
    const entry = map[name] ?? { amount: 0, color: transaction.category?.color ?? "gray", icon: transaction.category?.icon ?? "tag" }
    entry.amount += transaction.amount
    map[name] = entry
  }
  return Object.entries(map)
    .map(([name, entry]) => ({ name, ...entry, pct: total > 0 ? Math.round((entry.amount / total) * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
}

function computeRecurringVsVariable(transactions: Transaction[]) {
  const map: Record<string, { recurring: number; variable: number }> = {}
  for (const transaction of transactions.filter((item) => item.type === "expense")) {
    const key = transaction.occurredOn.slice(0, 7)
    const entry = map[key] ?? { recurring: 0, variable: 0 }
    if (transaction.recurringExpenseId) entry.recurring += transaction.amount
    else entry.variable += transaction.amount
    map[key] = entry
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([key, data]) => ({
    month: format(new Date(`${key}-15`), "MMM", { locale: es }),
    ...data,
  }))
}

function exportToCSV(transactions: Transaction[], filename: string) {
  const headers = ["Fecha", "Tipo", "Descripción", "Categoría", "Monto", "Notas"]
  const rows = transactions.map((transaction) => [
    transaction.occurredOn,
    transaction.type === "expense" ? "Gasto" : "Ingreso",
    transaction.description,
    transaction.category?.name ?? "Sin categoría",
    transaction.amount.toString(),
    transaction.notes ?? "",
  ])
  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

type ReportsPanelProps = {
  transactions: Transaction[]
  plan: MonthlyPlan | null
}

export function ReportsPanel({ transactions, plan }: ReportsPanelProps) {
  const [period, setPeriod] = useState<Period>("3m")
  const [csvConfirmOpen, setCsvConfirmOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<ReportTypeFilter>("expense")
  const { from: fromDate, to: toDate, label: periodLabel } = getPeriodDates(period)
  const all = transactions.filter((transaction) => transaction.occurredOn >= fromDate && transaction.occurredOn <= toDate)
  const totalIncome = all.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0)
  const totalExpenses = all.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0)
  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0
  const recurringExpenses = all.filter((transaction) => transaction.type === "expense" && transaction.recurringExpenseId)
  const variableExpenses = all.filter((transaction) => transaction.type === "expense" && !transaction.recurringExpenseId)
  const totalRecurring = recurringExpenses.reduce((sum, transaction) => sum + transaction.amount, 0)
  const totalVariable = variableExpenses.reduce((sum, transaction) => sum + transaction.amount, 0)
  const monthlySavings = calculateSavings(plan, totalIncome)
  const monthlyData = computeMonthlyData(all)
  const recurringVsVariableData = computeRecurringVsVariable(all)
  const breakdownType = typeFilter === "all" ? "expense" : typeFilter
  const filteredForBreakdown = all.filter((transaction) => transaction.type === breakdownType)
  const categoryBreakdown = computeCategoryBreakdown(filteredForBreakdown)
  const maxCategory = categoryBreakdown[0]?.amount ?? 1

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 print:p-0">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Reportes</h1>
            <p className="mt-1 text-sm capitalize text-muted-foreground">{periodLabel}</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" disabled={all.length === 0} onClick={() => setCsvConfirmOpen(true)}>
              <DownloadIcon />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <PrinterIcon />
              Imprimir
            </Button>
          </div>
        </div>
        <SegmentedControl value={period} onChange={setPeriod} options={PERIOD_OPTIONS} className="w-fit print:hidden" />
      </section>

      <ReportsVisuals
        monthlyData={monthlyData}
        recurringVsVariableData={recurringVsVariableData}
        categoryBreakdown={categoryBreakdown}
        maxCategory={maxCategory}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        balance={balance}
        savingsRate={savingsRate}
        monthlySavings={monthlySavings}
        hasPlan={Boolean(plan)}
        totalRecurring={totalRecurring}
        totalVariable={totalVariable}
        recurringCount={recurringExpenses.length}
        variableCount={variableExpenses.length}
      />

      <CsvExportConfirmDialog
        open={csvConfirmOpen}
        onOpenChange={setCsvConfirmOpen}
        title="Exportar reporte"
        description={`Se descargará un archivo CSV con ${all.length} transacción${all.length !== 1 ? "es" : ""} del ${fromDate} al ${toDate} (${periodLabel}).`}
        onConfirm={() => exportToCSV(all, `gastly-reporte-${fromDate}-${toDate}.csv`)}
      />
    </main>
  )
}
