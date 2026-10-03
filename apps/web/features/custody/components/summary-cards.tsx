import { SummaryMetricCards } from "@/components/summary-metric-cards";
import { computeCustodySummary } from "@/features/custody/lib/custody-api";
import { type CustodyOrder } from "@/features/custody/types/custody-types";
import { formatCurrency } from "@/lib/format";

export function SummaryCards({ orders }: { orders: CustodyOrder[] }) {
  const summary = computeCustodySummary(orders);

  return (
    <SummaryMetricCards
      ariaLabel="Resumen de custodia"
      cards={[
        {
          title: "En custodia",
          value: formatCurrency(summary.totalHeld),
          description: `${summary.activeCount} ${summary.activeCount === 1 ? "encargo activo" : "encargos activos"}`,
          emphasis: true,
        },
        {
          title: "Activos",
          value: String(summary.activeCount),
          description: "Encargos en curso",
        },
        {
          title: "Completados",
          value: String(summary.completedCount),
          description: "Encargos finalizados",
        },
      ]}
      columns={3}
    />
  );
}
