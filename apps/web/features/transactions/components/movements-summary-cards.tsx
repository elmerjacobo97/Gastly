"use client";

import { SummaryMetricCards } from "@/components/summary-metric-cards";
import {
  formatCurrencyTotals,
  subtractCurrencyTotals,
} from "@/lib/currency-totals";
import { type CurrencyTotals } from "@/lib/format";

type MovementsSummaryCardsProps = {
  income: CurrencyTotals;
  expense: CurrencyTotals;
  incomeCount: number;
  expenseCount: number;
};

export function MovementsSummaryCards({
  income,
  expense,
  incomeCount,
  expenseCount,
}: MovementsSummaryCardsProps) {
  const diff = subtractCurrencyTotals(income, expense);

  return (
    <SummaryMetricCards
      ariaLabel="Resumen de movimientos"
      cards={[
        {
          title: "Ingresos",
          value: formatCurrencyTotals(income),
          description: `${incomeCount} ${incomeCount === 1 ? "registro" : "registros"}`,
        },
        {
          title: "Gastos",
          value: formatCurrencyTotals(expense),
          description: `${expenseCount} ${expenseCount === 1 ? "registro" : "registros"}`,
        },
        {
          title: "Diferencia",
          value: formatCurrencyTotals(diff),
          description: "Ingresos menos gastos",
          emphasis: true,
          negative: Object.values(diff).some((amount) => amount < 0),
        },
      ]}
      columns={3}
    />
  );
}
