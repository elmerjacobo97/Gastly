import type { DuePayment } from "./types.ts";

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "long",
});

export function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function formatTotals(payments: DuePayment[]) {
  const totals = new Map<string, number>();
  for (const payment of payments) {
    totals.set(
      payment.currency,
      (totals.get(payment.currency) ?? 0) + payment.amount,
    );
  }
  return Array.from(totals, ([currency, amount]) =>
    formatCurrency(amount, currency),
  ).join(" · ");
}

export function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}
