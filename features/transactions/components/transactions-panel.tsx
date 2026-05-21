"use client"

import { useQuery } from "@tanstack/react-query"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CircleAlertIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
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

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { MonthlyPlanDialog } from "@/features/monthly-plan/components/monthly-plan-dialog"
import {
  calculateSavings,
  getMonthlyPlan,
} from "@/features/monthly-plan/lib/monthly-plan-api"
import { getFixedExpenses } from "@/features/fixed-expenses/lib/fixed-expenses-api"
import { type FixedExpense } from "@/features/fixed-expenses/types/fixed-expense-types"
import {
  getCategoryTotals,
  getMonthlyTotals,
} from "@/features/transactions/lib/charts-api"
import {
  computeSummary,
  getTransactions,
} from "@/features/transactions/lib/transactions-api"
import { formatCurrency } from "@/features/transactions/lib/format-transaction"

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

function isRelevantRecurringPayment(expense: FixedExpense, monthKey: string) {
  if (!expense.isActive) return false
  if (expense.frequency === "monthly") return true
  return expense.nextDueOn.startsWith(monthKey) || expense.paidOn?.startsWith(monthKey)
}

function getHealthState(usage: number, remaining: number) {
  if (remaining < 0 || usage >= 100) {
    return {
      label: "Rojo",
      description: "Ya te pasaste del dinero disponible.",
      className: "text-destructive",
      progressClassName: "[&>div]:bg-destructive",
    }
  }
  if (usage >= 85) {
    return {
      label: "Naranja",
      description: "Estás muy cerca del límite.",
      className: "text-orange-600 dark:text-orange-400",
      progressClassName: "[&>div]:bg-orange-500",
    }
  }
  if (usage >= 70) {
    return {
      label: "Amarillo",
      description: "Vas bien, pero conviene cuidar gastos.",
      className: "text-amber-600 dark:text-amber-400",
      progressClassName: "[&>div]:bg-amber-500",
    }
  }
  return {
    label: "Verde",
    description: "Tienes margen saludable para el mes.",
    className: "text-emerald-600 dark:text-emerald-400",
    progressClassName: "[&>div]:bg-emerald-500",
  }
}

export function TransactionsPanel({ userEmail }: TransactionsPanelProps) {
  const today = new Date()
  const monthKey = today.toISOString().slice(0, 7)
  const monthLabel = format(today, "MMMM yyyy", { locale: es })

  const transactionsQuery = useQuery({
    queryKey: ["transactions", monthKey],
    queryFn: () => getTransactions({ month: today }),
  })
  const planQuery = useQuery({
    queryKey: ["monthly-plan", monthKey],
    queryFn: () => getMonthlyPlan(today),
  })
  const fixedExpensesQuery = useQuery({
    queryKey: ["fixed-expenses", monthKey],
    queryFn: () => getFixedExpenses(today),
  })
  const monthlyQuery = useQuery({
    queryKey: ["monthly-totals"],
    queryFn: () => getMonthlyTotals(6),
  })
  const categoryQuery = useQuery({
    queryKey: ["category-totals", monthKey],
    queryFn: () => getCategoryTotals(today),
  })

  const transactions = transactionsQuery.data ?? []
  const summary = computeSummary(transactions)
  const plan = planQuery.data ?? null
  const recurringPayments = (fixedExpensesQuery.data ?? []).filter((expense) =>
    isRelevantRecurringPayment(expense, monthKey)
  )
  const savings = calculateSavings(plan)
  const recurringEstimated = recurringPayments.reduce((sum, expense) => {
    return sum + (expense.paidAmount ?? expense.amount)
  }, 0)
  const recurringPaid = recurringPayments.reduce((sum, expense) => {
    return sum + (expense.paidAmount ?? 0)
  }, 0)
  const availableAfterSavings = plan
    ? Math.max(plan.expectedIncome - savings, 0)
    : summary.income
  const availableForVariable = Math.max(availableAfterSavings - recurringEstimated, 0)
  const variableSpent = Math.max(summary.expenses - recurringPaid, 0)
  const remaining = availableForVariable - variableSpent
  const usage = availableForVariable > 0
    ? Math.round((variableSpent / availableForVariable) * 100)
    : variableSpent > 0
      ? 100
      : 0
  const health = getHealthState(usage, remaining)

  const summaryCards = [
    {
      title: "Disponible libre",
      value: formatCurrency(availableForVariable),
      description: plan ? "Después de ahorro y pagos recurrentes" : "Configura tu plan para mayor precisión",
      icon: WalletCardsIcon,
      positive: remaining >= 0,
    },
    {
      title: "Ahorro obligatorio",
      value: formatCurrency(savings),
      description: plan ? "Dinero que no debes tocar" : "Sin plan mensual",
      icon: ArrowUpIcon,
      positive: true,
    },
    {
      title: "Pagos recurrentes",
      value: formatCurrency(recurringEstimated),
      description: `${recurringPayments.length} pago${recurringPayments.length !== 1 ? "s" : ""} estimado${recurringPayments.length !== 1 ? "s" : ""}`,
      icon: ArrowDownIcon,
      positive: recurringEstimated <= availableAfterSavings,
    },
    {
      title: "Gastos variables",
      value: formatCurrency(variableSpent),
      description: `${usage}% de tu disponible libre`,
      icon: TrendingUpIcon,
      positive: usage < 85,
    },
  ]

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <Badge className="w-fit capitalize" variant="secondary">
            {monthLabel}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Hola, {userEmail?.split("@")[0] ?? "Usuario"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen de tus finanzas de este mes.
          </p>
        </div>
      </section>

      {!planQuery.isLoading && !plan && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <CircleAlertIcon className="mt-0.5 size-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium">Falta tu plan mensual</p>
                <p className="text-sm text-muted-foreground">
                  Configura tu ingreso estimado y ahorro obligatorio para que el semáforo sea preciso.
                </p>
              </div>
            </div>
            <MonthlyPlanDialog month={today} plan={plan} />
          </CardContent>
        </Card>
      )}

      {plan && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardDescription>Estado del mes</CardDescription>
                <CardTitle className={`mt-1 text-3xl ${health.className}`}>
                  {health.label}
                </CardTitle>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-muted-foreground">Restante libre</p>
                <p className={`text-2xl font-semibold tabular-nums ${remaining < 0 ? "text-destructive" : "text-foreground"}`}>
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Progress value={Math.min(usage, 100)} className={health.progressClassName} />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>{health.description}</span>
              <span className="tabular-nums">{usage}% usado</span>
            </div>
          </CardContent>
        </Card>
      )}

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
    </main>
  )
}
