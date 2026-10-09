import {
  CURRENCY_CODES,
  formatCurrency,
  type CurrencyCode,
  type CurrencyTotals,
} from "@/lib/format";

export function sumByCurrency<T extends { currency: CurrencyCode }>(
  payments: T[],
  getAmount: (payment: T) => number,
): CurrencyTotals {
  const totals: CurrencyTotals = {};
  for (const payment of payments) {
    totals[payment.currency] =
      (totals[payment.currency] ?? 0) + getAmount(payment);
  }
  return totals;
}

export function subtractCurrencyTotals(
  left: CurrencyTotals,
  right: CurrencyTotals,
): CurrencyTotals {
  const totals: CurrencyTotals = {};
  for (const currency of CURRENCY_CODES) {
    if (left[currency] !== undefined || right[currency] !== undefined) {
      totals[currency] = (left[currency] ?? 0) - (right[currency] ?? 0);
    }
  }
  return totals;
}

export function formatCurrencyTotals(totals: CurrencyTotals) {
  const parts = CURRENCY_CODES.filter((code) => totals[code] !== undefined).map(
    (code) => formatCurrency(totals[code] ?? 0, code),
  );
  return parts.length > 0 ? parts.join(" · ") : formatCurrency(0);
}
