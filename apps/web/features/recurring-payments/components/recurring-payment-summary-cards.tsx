"use client";

import { SummaryMetricCards } from "@/components/summary-metric-cards";
import { isRelevantForMonth } from "@/features/recurring-payments/lib/recurring-payment-helpers";
import { type RecurringPayment } from "@/lib/recurring-payment-types";
import { formatCurrency } from "@/lib/format";

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
  const totalCommitted = activeExpensePayments.reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const totalPaid = activeExpensePayments
    .filter((p) => p.paidOn)
    .reduce((sum, p) => sum + (p.paidAmount ?? p.amount), 0);
  const totalPending = Math.max(totalCommitted - totalPaid, 0);
  const allPaid = totalPending === 0;

  return (
    <SummaryMetricCards
      ariaLabel="Resumen de pagos recurrentes"
      cards={[
        {
          title: "Programado este mes",
          value: formatCurrency(totalCommitted),
          description:
            activeExpensePayments.length === 0
              ? "Sin pagos programados"
              : `${activeExpensePayments.length} ${activeExpensePayments.length === 1 ? "pago programado" : "pagos programados"}`,
        },
        {
          title: "Pagado este mes",
          value: formatCurrency(totalPaid),
          description: "Pagos recurrentes registrados",
        },
        {
          title: "Falta pagar este mes",
          value: formatCurrency(totalPending),
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
