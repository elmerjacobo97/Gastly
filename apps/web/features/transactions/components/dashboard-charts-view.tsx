"use client";

import { useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MonthlyIncomeExpenseChart } from "@/components/monthly-income-expense-chart";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type CategoryTotal,
  type MonthlyTotal,
} from "@/features/transactions/server/charts-queries";
import {
  CURRENCY_CODES,
  formatCurrency,
  type CurrencyCode,
} from "@/lib/format";

type DashboardChartsProps = {
  monthlyData?: MonthlyTotal[];
  categoryData?: CategoryTotal[];
};

export function DashboardChartsView({
  monthlyData,
  categoryData,
}: DashboardChartsProps) {
  const availableCurrencies = CURRENCY_CODES.filter(
    (currency) =>
      monthlyData?.some((item) => item.currency === currency) ||
      categoryData?.some((item) => item.currency === currency),
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    availableCurrencies[0] ?? "PEN",
  );
  const filteredMonthlyData = monthlyData?.filter(
    (item) => item.currency === currency,
  );
  const filteredCategoryData = categoryData?.filter(
    (item) => item.currency === currency,
  );

  return (
    <section className="flex min-w-0 flex-col gap-4">
      {availableCurrencies.length > 1 && (
        <div className="flex justify-end">
          <div role="group" aria-label="Moneda de gráficos">
            <SegmentedControl
              value={currency}
              onChange={setCurrency}
              options={availableCurrencies.map((code) => ({
                value: code,
                label: code,
              }))}
            />
          </div>
        </div>
      )}
      <div className="grid min-w-0 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Últimos 6 meses</CardTitle>
            <CardDescription>
              Ingresos vs gastos por mes · {currency}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMonthlyData ? (
              <MonthlyIncomeExpenseChart
                data={filteredMonthlyData}
                currency={currency}
              />
            ) : (
              <Skeleton className="h-52 w-full rounded-lg" />
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Gastos por categoría</CardTitle>
            <CardDescription>Top 5 del mes actual · {currency}</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCategoryData && filteredCategoryData.length > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="h-40 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredCategoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      />
                      <Tooltip
                        formatter={(
                          value: unknown,
                          _name: unknown,
                          props: { payload?: { name?: string } },
                        ) => [
                          formatCurrency(Number(value), currency),
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
                </div>
                <div className="flex flex-col gap-2">
                  {filteredCategoryData.map((cat) => (
                    <div
                      key={`${cat.currency}:${cat.name}`}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2.5 shrink-0 rounded-sm"
                          style={{ background: cat.fill }}
                        />
                        <span className="text-muted-foreground">
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(cat.value, currency)}
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
      </div>
    </section>
  );
}
