import {
  SummaryMetricCards,
  type SummaryMetricCard,
} from "@/components/summary-metric-cards";
import { formatCurrencyTotals } from "@/lib/currency-totals";
import { type CurrencyCode, type CurrencyTotals } from "@/lib/format";

type DashboardSummaryCardsProps = {
  monthlyIncome: CurrencyTotals;
  monthlyExpenses: CurrencyTotals;
  monthlyBalance: CurrencyTotals;
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
      value: formatCurrencyTotals(monthlyBalance),
      description: "Ingresos menos gastos del mes",
      emphasis: true,
      negative: Object.values(monthlyBalance).some((amount) => amount < 0),
    },
    {
      title: "Ingresos del mes",
      value: formatCurrencyTotals(monthlyIncome),
      description: `${incomeMovementCount} ${incomeMovementCount === 1 ? "movimiento registrado" : "movimientos registrados"}`,
    },
    {
      title: "Gastos del mes",
      value: formatCurrencyTotals(monthlyExpenses),
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
