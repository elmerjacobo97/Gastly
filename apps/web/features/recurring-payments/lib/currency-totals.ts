import {
  CURRENCY_CODES,
  formatCurrency,
  type CurrencyCode,
} from "@/lib/format";
import { type RecurringPayment } from "@/lib/recurring-payment-types";

export function sumByCurrency(
  payments: RecurringPayment[],
  getAmount: (payment: RecurringPayment) => number,
) {
  const totals: Partial<Record<CurrencyCode, number>> = {};
  for (const payment of payments) {
    totals[payment.currency] =
      (totals[payment.currency] ?? 0) + getAmount(payment);
  }
  return totals;
}

export function formatCurrencyTotals(
  totals: Partial<Record<CurrencyCode, number>>,
) {
  const parts = CURRENCY_CODES.filter((code) => totals[code] !== undefined).map(
    (code) => formatCurrency(totals[code] ?? 0, code),
  );
  return parts.length > 0 ? parts.join(" + ") : formatCurrency(0);
}
