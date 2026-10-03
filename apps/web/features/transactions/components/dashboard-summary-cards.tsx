import {
  SummaryMetricCards,
  type SummaryMetricCard,
} from "@/components/summary-metric-cards";
import { formatCurrencyTotals } from "@/lib/currency-totals";
import { formatCurrency, type CurrencyCode } from "@/lib/format";

type DashboardSummaryCardsProps = {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  pendingTotals: Partial<Record<CurrencyCode, number>>;
  incomeMovementCount: number;
  expenseMovementCount: number;
  pendingPaymentCount: number;
};

export function DashboardSummaryCards({
  monthlyIncome,
  monthlyExpenses,
  monthlyBalance,
  pendingTotals,
  incomeMovementCount,
  expenseMovementCount,
  pendingPaymentCount,
}: DashboardSummaryCardsProps) {
  const cards: SummaryMetricCard[] = [
    {
      title: "Balance neto",
      value: formatCurrency(monthlyBalance),
      description: "Ingresos menos gastos del mes",
      emphasis: true,
      negative: monthlyBalance < 0,
    },
    {
      title: "Ingresos del mes",
      value: formatCurrency(monthlyIncome),
      description: `${incomeMovementCount} ${incomeMovementCount === 1 ? "movimiento registrado" : "movimientos registrados"}`,
    },
    {
      title: "Gastos del mes",
      value: formatCurrency(monthlyExpenses),
      description: `${expenseMovementCount} ${expenseMovementCount === 1 ? "movimiento registrado" : "movimientos registrados"}`,
    },
    {
      title: "Por pagar este mes",
      value: formatCurrencyTotals(pendingTotals),
      description:
        pendingPaymentCount === 0
          ? "Sin recurrentes ni cuotas pendientes"
          : `${pendingPaymentCount} ${pendingPaymentCount === 1 ? "pago pendiente" : "pagos pendientes"} de recurrentes y cuotas`,
    },
  ];

  return (
    <SummaryMetricCards
      ariaLabel="Resumen financiero del mes"
      cards={cards}
      columns={4}
    />
  );
}
