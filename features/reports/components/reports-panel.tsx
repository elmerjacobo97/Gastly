"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarClockIcon,
  DownloadIcon,
  PiggyBankIcon,
  PrinterIcon,
  ScaleIcon,
  ShuffleIcon,
} from "lucide-react"
import {
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns"
import { es } from "date-fns/locale"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoryIconBadge } from "@/features/categories/components/category-icon"
import {
  calculateSavings,
  getMonthlyPlan,
} from "@/features/monthly-plan/lib/monthly-plan-api"
import { getAllTransactions } from "@/features/transactions/lib/charts-api"
import { formatCurrency } from "@/lib/format"
import { CHART_COLORS, formatCompact } from "@/lib/chart-utils"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { type Transaction } from "@/features/transactions/types/transaction-types"

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
      return {
        from: format(startOfMonth(today), "yyyy-MM-dd"),
        to: format(today, "yyyy-MM-dd"),
        label: format(today, "MMMM yyyy", { locale: es }),
      }
    case "3m":
      return {
        from: format(startOfMonth(subMonths(today, 2)), "yyyy-MM-dd"),
        to: format(today, "yyyy-MM-dd"),
        label: "Últimos 3 meses",
      }
    case "6m":
      return {
        from: format(startOfMonth(subMonths(today, 5)), "yyyy-MM-dd"),
        to: format(today, "yyyy-MM-dd"),
        label: "Últimos 6 meses",
      }
    case "year":
      return {
        from: format(startOfYear(today), "yyyy-MM-dd"),
        to: format(today, "yyyy-MM-dd"),
        label: `Año ${today.getFullYear()}`,
      }
    case "last-year": {
      const lastYear = new Date(today.getFullYear() - 1, 0, 1)
      return {
        from: format(startOfYear(lastYear), "yyyy-MM-dd"),
        to: format(endOfYear(lastYear), "yyyy-MM-dd"),
        label: `Año ${today.getFullYear() - 1}`,
      }
    }
  }
}

function computeMonthlyData(transactions: Transaction[]) {
  const map: Record<string, { income: number; expenses: number }> = {}
  for (const t of transactions) {
    const key = t.occurredOn.slice(0, 7)
    if (!map[key]) map[key] = { income: 0, expenses: 0 }
    if (t.type === "income") map[key].income += t.amount
    else map[key].expenses += t.amount
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => ({
      month: format(new Date(key + "-15"), "MMM", { locale: es }),
      ...data,
    }))
}

function computeCategoryBreakdown(transactions: Transaction[]) {
  const total = transactions.reduce((s, t) => s + t.amount, 0)
  const map: Record<string, { amount: number; color: string; icon: string }> = {}
  for (const t of transactions) {
    const name = t.category?.name ?? "Sin categoría"
    const entry = map[name] ?? {
      amount: 0,
      color: t.category?.color ?? "gray",
      icon: t.category?.icon ?? "tag",
    }
    entry.amount += t.amount
    map[name] = entry
  }
  return Object.entries(map)
    .map(([name, entry]) => ({
      name,
      amount: entry.amount,
      color: entry.color,
      icon: entry.icon,
      pct: total > 0 ? Math.round((entry.amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
}

function computeRecurringVsVariable(transactions: Transaction[]) {
  const expenses = transactions.filter((t) => t.type === "expense")
  const map: Record<string, { recurring: number; variable: number }> = {}
  for (const t of expenses) {
    const key = t.occurredOn.slice(0, 7)
    if (!map[key]) map[key] = { recurring: 0, variable: 0 }
    if (t.recurringExpenseId) map[key].recurring += t.amount
    else map[key].variable += t.amount
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => ({
      month: format(new Date(key + "-15"), "MMM", { locale: es }),
      ...data,
    }))
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

type TypeFilter = "all" | "expense" | "income"

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
]

export function ReportsPanel() {
  const [period, setPeriod] = useState<Period>("3m")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("expense")
  const { from: fromDate, to: toDate, label: periodLabel } = getPeriodDates(period)
  const today = new Date()
  const filename = `gastly-reporte-${fromDate}-${toDate}.csv`

  const transactionsQuery = useQuery({
    queryKey: ["report-transactions", fromDate, toDate],
    queryFn: () => getAllTransactions({ from: fromDate, to: toDate }),
  })
  const planQuery = useQuery({
    queryKey: ["monthly-plan", today.toISOString().slice(0, 7)],
    queryFn: () => getMonthlyPlan(today),
  })

  const all = transactionsQuery.data ?? []
  const plan = planQuery.data ?? null
  const totalIncome = all
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0)
  const totalExpenses = all
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpenses
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0

  const recurringExpenses = all.filter((t) => t.type === "expense" && t.recurringExpenseId)
  const variableExpenses = all.filter((t) => t.type === "expense" && !t.recurringExpenseId)
  const totalRecurring = recurringExpenses.reduce((s, t) => s + t.amount, 0)
  const totalVariable = variableExpenses.reduce((s, t) => s + t.amount, 0)

  const monthlySavings = calculateSavings(plan)
  const projectedAnnualSavings = monthlySavings * 12

  const monthlyData = computeMonthlyData(all)
  const recurringVsVariableData = computeRecurringVsVariable(all)
  const breakdownType = typeFilter === "all" ? "expense" : typeFilter
  const filteredForBreakdown = all.filter((t) => t.type === breakdownType)
  const categoryBreakdown = computeCategoryBreakdown(filteredForBreakdown)
  const maxCategory = categoryBreakdown[0]?.amount ?? 1

  const summaryCards = [
    {
      title: "Total ingresos",
      value: formatCurrency(totalIncome),
      icon: ArrowUpIcon,
      positive: true,
    },
    {
      title: "Total gastos",
      value: formatCurrency(totalExpenses),
      icon: ArrowDownIcon,
      positive: false,
    },
    {
      title: "Balance neto",
      value: formatCurrency(balance),
      description: savingsRate > 0 ? `Tasa de ahorro: ${savingsRate}%` : undefined,
      icon: ScaleIcon,
      positive: balance >= 0,
    },
    ...(plan
      ? [
          {
            title: "Ahorro proyectado anual",
            value: formatCurrency(projectedAnnualSavings),
            description: `${formatCurrency(monthlySavings)}/mes × 12`,
            icon: PiggyBankIcon,
            positive: true,
          },
        ]
      : []),
  ]

  const isLoading = transactionsQuery.isLoading

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 print:p-0">
      {/* Header */}
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Reportes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground capitalize">
              {periodLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="outline"
              disabled={all.length === 0}
              onClick={() => exportToCSV(all, filename)}
            >
              <DownloadIcon />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <PrinterIcon />
              Imprimir
            </Button>
          </div>
        </div>
        <SegmentedControl
          value={period}
          onChange={setPeriod}
          options={PERIOD_OPTIONS}
          className="w-fit print:hidden"
        />
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-28" />
                  </div>
                  <Skeleton className="size-10 rounded-xl" />
                </CardHeader>
              </Card>
            ))
          : summaryCards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <div>
                    <CardDescription className="text-xs">{card.title}</CardDescription>
                    <CardTitle
                      className={`mt-1.5 text-2xl tabular-nums ${
                        card.positive ? "text-foreground" : "text-destructive"
                      }`}
                    >
                      {card.value}
                    </CardTitle>
                    {card.description && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {card.description}
                      </p>
                    )}
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
              </Card>
            ))}
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Monthly bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos vs gastos</CardTitle>
            <CardDescription>Comparativa mensual del período</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={monthlyData}
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
                  <Bar dataKey="income" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm" style={{ background: "var(--color-chart-1)" }} />
                Ingresos
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm" style={{ background: "var(--color-chart-2)" }} />
                Gastos
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">
                  {typeFilter === "income" ? "Ingresos por categoría" : "Gastos por categoría"}
                </CardTitle>
                <CardDescription>
                  Top categorías del período · {filteredForBreakdown.length} {typeFilter === "income" ? "ingresos" : "gastos"}
                </CardDescription>
              </div>
              <SegmentedControl
                value={typeFilter}
                onChange={setTypeFilter}
                options={TYPE_OPTIONS}
                className="print:hidden"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3.5 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : categoryBreakdown.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Sin gastos en el período
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {categoryBreakdown.map((cat, i) => (
                  <div key={cat.name} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <CategoryIconBadge
                          icon={cat.icon}
                          color={cat.color}
                          className="size-6 rounded-md"
                        />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="tabular-nums">{formatCurrency(cat.amount)}</span>
                        <span className="w-8 text-right tabular-nums">{cat.pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(cat.amount / maxCategory) * 100}%`,
                          background: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recurring vs Variable */}
      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recurrentes vs variables</CardTitle>
            <CardDescription>Composición mensual de los gastos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full rounded-lg" />
            ) : recurringVsVariableData.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Sin gastos en el período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={recurringVsVariableData}
                  margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
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
                      name === "recurring" ? "Recurrentes" : "Variables",
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
                  <Bar dataKey="recurring" stackId="a" fill="var(--color-chart-3)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="variable" stackId="a" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm" style={{ background: "var(--color-chart-3)" }} />
                Recurrentes
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm" style={{ background: "var(--color-chart-4)" }} />
                Variables
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Composición de gastos</CardTitle>
            <CardDescription>Recurrentes vs variables en el período</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : totalExpenses === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Sin gastos en el período
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarClockIcon className="size-4 text-muted-foreground" />
                      <span>Recurrentes</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="tabular-nums font-medium text-foreground">{formatCurrency(totalRecurring)}</span>
                      <span className="w-8 text-right tabular-nums">
                        {totalExpenses > 0 ? Math.round((totalRecurring / totalExpenses) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${totalExpenses > 0 ? (totalRecurring / totalExpenses) * 100 : 0}%`,
                        background: "var(--color-chart-3)",
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <ShuffleIcon className="size-4 text-muted-foreground" />
                      <span>Variables</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="tabular-nums font-medium text-foreground">{formatCurrency(totalVariable)}</span>
                      <span className="w-8 text-right tabular-nums">
                        {totalExpenses > 0 ? Math.round((totalVariable / totalExpenses) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${totalExpenses > 0 ? (totalVariable / totalExpenses) * 100 : 0}%`,
                        background: "var(--color-chart-4)",
                      }}
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  {recurringExpenses.length} pago{recurringExpenses.length !== 1 ? "s" : ""} recurrente{recurringExpenses.length !== 1 ? "s" : ""} · {variableExpenses.length} gasto{variableExpenses.length !== 1 ? "s" : ""} variable{variableExpenses.length !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
