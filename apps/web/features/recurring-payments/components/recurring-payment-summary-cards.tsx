"use client";

import { SummaryMetricCards } from "@/components/summary-metric-cards";
import { formatCurrencyTotals, sumByCurrency } from "@/lib/currency-totals";
import { isRelevantForMonth } from "@/features/recurring-payments/lib/recurring-payment-helpers";
import { type RecurringPayment } from "@/lib/recurring-payment-types";

type RecurringPaymentSummaryCardsProps = {
  payments: RecurringPayment[];
  monthKey: string;
};

export function RecurringPaymentSummaryCards({
  payments,
  monthKey,
}: RecurringPaymentSummaryCardsProps) {
  const activeExpensePayments = payments.filter(
    (p) =>
      p.type === "expense" && p.isActive && isRelevantForMonth(p, monthKey),
  );
  const committed = sumByCurrency(activeExpensePayments, (p) => p.amount);
  const paid = sumByCurrency(
    activeExpensePayments
      .filter((payment) => payment.paidOn)
      .map((payment) => ({
        currency: payment.paidCurrency ?? payment.currency,
        amount: payment.paidAmount ?? payment.amount,
      })),
    (payment) => payment.amount,
  );
  const pending = sumByCurrency(activeExpensePayments, (p) =>
    p.paidOn ? 0 : p.amount,
  );
  const allPaid = activeExpensePayments.every((payment) => payment.paidOn);

  return (
    <SummaryMetricCards
      ariaLabel="Resumen de pagos recurrentes"
      cards={[
        {
          title: "Programado este mes",
          value: formatCurrencyTotals(committed),
          description:
            activeExpensePayments.length === 0
              ? "Sin pagos programados"
              : `${activeExpensePayments.length} ${activeExpensePayments.length === 1 ? "pago programado" : "pagos programados"}`,
        },
        {
          title: "Pagado este mes",
          value: formatCurrencyTotals(paid),
          description: "Pagos recurrentes registrados",
        },
        {
          title: "Falta pagar este mes",
          value: formatCurrencyTotals(pending),
          description:
            activeExpensePayments.length === 0
              ? "Sin pagos programados"
              : allPaid
                ? "Todo pagado"
                : "Saldo pendiente de pagos recurrentes",
          emphasis: true,
        },
      ]}
      columns={3}
    />
  );
}
