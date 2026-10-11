import { SummaryMetricCards } from "@/components/summary-metric-cards";
import { CURRENCY_CODES, formatCurrency } from "@/lib/format";
import { type WishlistItem } from "@/features/wishlist/types/wishlist-types";

function pendingTotalLabels(pending: WishlistItem[]): string {
  return CURRENCY_CODES.flatMap((currency) => {
    const total = pending
      .filter((item) => item.currency === currency)
      .reduce((sum, item) => sum + item.estimatedPrice, 0);
    return total > 0 ? [formatCurrency(total, currency)] : [];
  }).join(" · ");
}

export function SummaryCards({ items }: { items: WishlistItem[] }) {
  const pending = items.filter((item) => item.status === "pending");
  const purchasedCount = items.length - pending.length;
  const highPriorityCount = pending.filter(
    (item) => item.priority === "high",
  ).length;

  return (
    <SummaryMetricCards
      ariaLabel="Resumen de lista de deseos"
      cards={[
        {
          title: "Por comprar",
          value: String(pending.length),
          description: `${purchasedCount} ${purchasedCount === 1 ? "comprado" : "comprados"}`,
        },
        {
          title: "Costo estimado",
          value: pendingTotalLabels(pending) || formatCurrency(0),
          description: "Suma de lo pendiente",
          emphasis: true,
        },
        {
          title: "Prioridad alta",
          value: String(highPriorityCount),
          description: "Pendientes marcados como alta",
        },
      ]}
      columns={3}
    />
  );
}
