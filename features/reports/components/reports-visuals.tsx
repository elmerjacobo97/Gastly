"use client"

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarClockIcon,
  PiggyBankIcon,
  ScaleIcon,
  ShuffleIcon,
  type LucideIcon,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { CategoryIconBadge } from "@/components/category-icon-badge"
import { MonthlyIncomeExpenseChart } from "@/components/monthly-income-expense-chart"
import { SegmentedControl } from "@/components/ui/segmented-control"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { CHART_COLORS, formatCompact } from "@/lib/chart-utils"

export type ReportTypeFilter = "all" | "expense" | "income"

type MonthlyDatum = { month: string; income: number; expenses: number }
type RecurringDatum = { month: string; recurring: number; variable: number }
type CategoryDatum = { name: string; amount: number; color: string; icon: string; pct: number }

const PERIOD_OPTIONS = [
  { value: "all" as const, label: "Todos" },
  { value: "expense" as const, label: "Gastos" },
  { value: "income" as const, label: "Ingresos" },
]

function MonthlyChartCard({ data }: { data: MonthlyDatum[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ingresos vs gastos</CardTitle>
        <CardDescription>Comparativa mensual del período</CardDescription>
      </CardHeader>
      <CardContent>
        <MonthlyIncomeExpenseChart data={data} />
      </CardContent>
    </Card>
  )
}

function CategoryBreakdownCard({
  typeFilter,
  onTypeFilterChange,
  categories,
  maxCategory,
}: {
  typeFilter: ReportTypeFilter
  onTypeFilterChange: (value: ReportTypeFilter) => void
  categories: CategoryDatum[]
  maxCategory: number
}) {
  const label = typeFilter === "income" ? "Ingresos" : "Gastos"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{label} por categoría</CardTitle>
            <CardDescription>Top categorías del período · {categories.length} {label.toLowerCase()}</CardDescription>
          </div>
          <SegmentedControl value={typeFilter} onChange={onTypeFilterChange} options={PERIOD_OPTIONS} className="print:hidden" />
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Sin gastos en el período</div>
        ) : (
          <div className="flex flex-col gap-3">
            {categories.map((category, index) => (
              <div key={category.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <CategoryIconBadge icon={category.icon} color={category.color} className="size-6 rounded-md" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="tabular-nums">{formatCurrency(category.amount)}</span>
                    <span className="w-8 text-right tabular-nums">{category.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-[width]" style={{ width: `${(category.amount / maxCategory) * 100}%`, background: CHART_COLORS[index % CHART_COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RecurringChartCard({ data }: { data: RecurringDatum[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recurrentes vs variables</CardTitle>
        <CardDescription>Composición mensual de los gastos</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Sin gastos en el período</div>
        ) : (
          <div className="h-52.5 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [formatCurrency(Number(value)), name === "recurring" ? "Recurrentes" : "Variables"]}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--popover-foreground)", fontSize: 13 }}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                />
                <Bar dataKey="recurring" stackId="a" fill="var(--color-chart-3)" />
                <Bar dataKey="variable" stackId="a" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-sm" style={{ background: "var(--color-chart-3)" }} />Recurrentes</div>
          <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-sm" style={{ background: "var(--color-chart-4)" }} />Variables</div>
        </div>
      </CardContent>
    </Card>
  )
}

function ExpenseCompositionCard({
  totalExpenses,
  totalRecurring,
  totalVariable,
  recurringCount,
  variableCount,
}: {
  totalExpenses: number
  totalRecurring: number
  totalVariable: number
  recurringCount: number
  variableCount: number
}) {
  if (totalExpenses === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Composición de gastos</CardTitle><CardDescription>Recurrentes vs variables en el período</CardDescription></CardHeader>
        <CardContent><div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Sin gastos en el período</div></CardContent>
      </Card>
    )
  }

  const rows = [
    { label: "Recurrentes", icon: CalendarClockIcon, amount: totalRecurring, color: "var(--color-chart-3)" },
    { label: "Variables", icon: ShuffleIcon, amount: totalVariable, color: "var(--color-chart-4)" },
  ]

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Composición de gastos</CardTitle><CardDescription>Recurrentes vs variables en el período</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-5">
        {rows.map((row) => {
          const Icon = row.icon
          const percentage = (row.amount / totalExpenses) * 100
          return (
            <div key={row.label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><Icon className="size-4 text-muted-foreground" /><span>{row.label}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><span className="font-medium tabular-nums text-foreground">{formatCurrency(row.amount)}</span><span className="w-8 text-right tabular-nums">{Math.round(percentage)}%</span></div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${percentage}%`, background: row.color }} /></div>
            </div>
          )
        })}
        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          {recurringCount} pago{recurringCount !== 1 ? "s" : ""} recurrente{recurringCount !== 1 ? "s" : ""} · {variableCount} gasto{variableCount !== 1 ? "s" : ""} variable{variableCount !== 1 ? "s" : ""}
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryCards({
  totalIncome,
  totalExpenses,
  balance,
  savingsRate,
  monthlySavings,
  plan,
}: {
  totalIncome: number
  totalExpenses: number
  balance: number
  savingsRate: number
  monthlySavings: number
  plan: boolean
}) {
  const cards: { title: string; value: string; description?: string; icon: LucideIcon; positive: boolean }[] = [
    { title: "Total ingresos", value: formatCurrency(totalIncome), icon: ArrowUpIcon, positive: true },
    { title: "Total gastos", value: formatCurrency(totalExpenses), icon: ArrowDownIcon, positive: false },
    { title: "Balance neto", value: formatCurrency(balance), description: savingsRate > 0 ? `Tasa de ahorro: ${savingsRate}%` : undefined, icon: ScaleIcon, positive: balance >= 0 },
    ...(plan ? [{ title: "Ahorro proyectado anual", value: formatCurrency(monthlySavings * 12), description: `${formatCurrency(monthlySavings)}/mes × 12`, icon: PiggyBankIcon, positive: true }] : []),
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.title} className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
          <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${card.positive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}><card.icon className="size-4" /></div>
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-muted-foreground">{card.title}</p>{card.description && <p className="truncate text-xs text-muted-foreground">{card.description}</p>}</div>
          <p className={`shrink-0 text-lg font-semibold tabular-nums ${card.positive ? "text-foreground" : "text-destructive"}`}>{card.value}</p>
        </div>
      ))}
    </section>
  )
}

export function ReportsVisuals({
  monthlyData,
  recurringVsVariableData,
  categoryBreakdown,
  maxCategory,
  typeFilter,
  onTypeFilterChange,
  totalIncome,
  totalExpenses,
  balance,
  savingsRate,
  monthlySavings,
  hasPlan,
  totalRecurring,
  totalVariable,
  recurringCount,
  variableCount,
}: {
  monthlyData: MonthlyDatum[]
  recurringVsVariableData: RecurringDatum[]
  categoryBreakdown: CategoryDatum[]
  maxCategory: number
  typeFilter: ReportTypeFilter
  onTypeFilterChange: (value: ReportTypeFilter) => void
  totalIncome: number
  totalExpenses: number
  balance: number
  savingsRate: number
  monthlySavings: number
  hasPlan: boolean
  totalRecurring: number
  totalVariable: number
  recurringCount: number
  variableCount: number
}) {
  return (
    <>
      <SummaryCards
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        balance={balance}
        savingsRate={savingsRate}
        monthlySavings={monthlySavings}
        plan={hasPlan}
      />
      <section className="grid min-w-0 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <MonthlyChartCard data={monthlyData} />
        <CategoryBreakdownCard typeFilter={typeFilter} onTypeFilterChange={onTypeFilterChange} categories={categoryBreakdown} maxCategory={maxCategory} />
      </section>
      <section className="grid min-w-0 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <RecurringChartCard data={recurringVsVariableData} />
        <ExpenseCompositionCard totalExpenses={totalExpenses} totalRecurring={totalRecurring} totalVariable={totalVariable} recurringCount={recurringCount} variableCount={variableCount} />
      </section>
    </>
  )
}
