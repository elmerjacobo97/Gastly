"use client"

import { lazy, Suspense, type ComponentType } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { formatCompact } from "@/lib/chart-utils"
import { formatCurrency } from "@/lib/format"

type ChartProps = Record<string, unknown>

const Bar = lazy(() => import("recharts").then(({ Bar }) => ({ default: Bar as unknown as ComponentType<ChartProps> })))
const BarChart = lazy(() => import("recharts").then(({ BarChart }) => ({ default: BarChart as unknown as ComponentType<ChartProps> })))
const CartesianGrid = lazy(() => import("recharts").then(({ CartesianGrid }) => ({ default: CartesianGrid as unknown as ComponentType<ChartProps> })))
const ResponsiveContainer = lazy(() => import("recharts").then(({ ResponsiveContainer }) => ({ default: ResponsiveContainer as unknown as ComponentType<ChartProps> })))
const Tooltip = lazy(() => import("recharts").then(({ Tooltip }) => ({ default: Tooltip as unknown as ComponentType<ChartProps> })))
const XAxis = lazy(() => import("recharts").then(({ XAxis }) => ({ default: XAxis as unknown as ComponentType<ChartProps> })))
const YAxis = lazy(() => import("recharts").then(({ YAxis }) => ({ default: YAxis as unknown as ComponentType<ChartProps> })))

export type MonthlyIncomeExpenseDatum = { month: string; income: number; expenses: number }

export function MonthlyIncomeExpenseChart({ data }: { data: MonthlyIncomeExpenseDatum[] }) {
  return (
    <>
      <Suspense fallback={<Skeleton className="h-52 w-full rounded-lg" />}>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value: unknown, name: unknown) => [formatCurrency(Number(value)), name === "income" ? "Ingresos" : "Gastos"]}
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--popover-foreground)", fontSize: 13 }}
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            />
            <Bar dataKey="income" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Suspense>
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
    </>
  )
}
