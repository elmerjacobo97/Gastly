import { endOfMonth, format, startOfMonth } from "date-fns";

type InstallmentPaymentLike = {
  dueOn: string;
  transactionId: string | null;
  paidExternally: boolean;
};

type InstallmentPurchaseLike = {
  payments: InstallmentPaymentLike[];
};

function isUnpaid(payment: InstallmentPaymentLike) {
  return !payment.transactionId && !payment.paidExternally;
}

function monthBounds(month: Date) {
  return {
    start: format(startOfMonth(month), "yyyy-MM-dd"),
    end: format(endOfMonth(month), "yyyy-MM-dd"),
  };
}

export function getMonthInstallments<T extends InstallmentPurchaseLike>(
  purchases: T[],
  month: Date,
): Array<{ payment: T["payments"][number]; purchase: T }> {
  const { start, end } = monthBounds(month);
  const installments: Array<{
    payment: T["payments"][number];
    purchase: T;
  }> = [];

  for (const purchase of purchases) {
    for (const payment of purchase.payments) {
      if (payment.dueOn >= start && payment.dueOn <= end) {
        installments.push({ payment, purchase });
      }
    }
  }

  return installments;
}

export function getDisplayInstallment<T extends InstallmentPurchaseLike>(
  purchase: T,
  month: Date,
): T["payments"][number] | undefined {
  const { start, end } = monthBounds(month);
  const thisMonth = purchase.payments.find(
    (payment) => payment.dueOn >= start && payment.dueOn <= end,
  );

  if (thisMonth && isUnpaid(thisMonth)) return thisMonth;

  return purchase.payments.find(
    (payment) => isUnpaid(payment) && payment.dueOn >= start,
  );
}
