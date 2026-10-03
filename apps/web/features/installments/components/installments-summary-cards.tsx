"use client";

import { SummaryMetricCards } from "@/components/summary-metric-cards";
import { formatCurrency } from "@/lib/format";
import { type InstallmentPurchase } from "@/lib/installment-types";
import { getMonthInstallments } from "@/lib/installments-calcs";

type InstallmentsSummaryCardsProps = {
  purchases: InstallmentPurchase[];
  month: Date;
};

export function InstallmentsSummaryCards({
  purchases,
  month,
}: InstallmentsSummaryCardsProps) {
  const monthPayments = getMonthInstallments(purchases, month);
  const paidThisMonth = monthPayments.filter(
    ({ payment }) => payment.transactionId || payment.paidExternally,
  );
  const totalThisMonth = monthPayments.reduce(
    (s, { payment }) => s + payment.amount,
    0,
  );
  const totalPaidThisMonth = paidThisMonth.reduce(
    (s, { payment }) => s + payment.amount,
    0,
  );
  const activePurchases = purchases.filter((p) => p.pendingCount > 0);
  const totalPending = activePurchases.reduce((s, p) => s + p.totalPending, 0);

  return (
    <SummaryMetricCards
      ariaLabel="Resumen de cuotas"
      cards={[
        {
          title: "Pendiente total",
          value: formatCurrency(totalPending),
          description: `${activePurchases.length} ${activePurchases.length === 1 ? "compra activa" : "compras activas"}`,
          emphasis: true,
        },
        {
          title: "Cuotas de este mes",
          value: formatCurrency(totalThisMonth),
          description: `${monthPayments.length} ${monthPayments.length === 1 ? "cuota programada" : "cuotas programadas"}`,
        },
        {
          title: "Pagado este mes",
          value: formatCurrency(totalPaidThisMonth),
          description: `${paidThisMonth.length} ${paidThisMonth.length === 1 ? "cuota pagada" : "cuotas pagadas"}`,
        },
      ]}
      columns={3}
    />
  );
}
