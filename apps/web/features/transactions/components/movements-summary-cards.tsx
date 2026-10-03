"use client";

import { SummaryMetricCards } from "@/components/summary-metric-cards";
import { formatCurrency } from "@/lib/format";

type MovementsSummaryCardsProps = {
  income: number;
  expense: number;
  incomeCount: number;
  expenseCount: number;
};

export function MovementsSummaryCards({
  income,
  expense,
  incomeCount,
  expenseCount,
}: MovementsSummaryCardsProps) {
  const diff = income - expense;

  return (
    <SummaryMetricCards
      ariaLabel="Resumen de movimientos"
      cards={[
        {
          title: "Ingresos",
          value: formatCurrency(income),
          description: `${incomeCount} ${incomeCount === 1 ? "registro" : "registros"}`,
        },
        {
          title: "Gastos",
          value: formatCurrency(expense),
          description: `${expenseCount} ${expenseCount === 1 ? "registro" : "registros"}`,
        },
        {
          title: "Diferencia",
          value: `${diff >= 0 ? "+" : ""}${formatCurrency(diff)}`,
          description: "Ingresos menos gastos",
          emphasis: true,
          negative: diff < 0,
        },
      ]}
      columns={3}
    />
  );
}
