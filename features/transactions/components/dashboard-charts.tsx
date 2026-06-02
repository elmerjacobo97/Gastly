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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { type CategoryTotal, type MonthlyTotal } from "@/features/transactions/lib/charts-api"
import { CHART_COLORS, formatCompact } from "@/lib/chart-utils"
import { formatCurrency } from "@/lib/format"

type DashboardChartsProps = {
  monthlyData?: MonthlyTotal[]
  monthlyIsLoading: boolean
  categoryData?: CategoryTotal[]
  categoryIsLoading: boolean
}

export function DashboardCharts({
  monthlyData,
  monthlyIsLoading,
  categoryData,
  categoryIsLoading,
}: DashboardChartsProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos 6 meses</CardTitle>
          <CardDescription>Ingresos vs gastos por mes</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyIsLoading ? (
            <Skeleton className="h-52 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart
                data={monthlyData}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos por categoría</CardTitle>
          <CardDescription>Top 5 del mes actual</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryIsLoading ? (
            <Skeleton className="h-52 w-full rounded-lg" />
          ) : categoryData && categoryData.length > 0 ? (
            <div className="flex flex-col gap-4">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, _name, props) => [
                      formatCurrency(Number(val)),
                      props.payload?.name ?? "",
                    ]}
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
                {categoryData.map((cat, index) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2.5 shrink-0 rounded-sm"
                        style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className="font-medium tabular-nums">{formatCurrency(cat.value)}</span>
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
  )
}
