"use client";

import { SummaryMetricCards } from "@/components/summary-metric-cards";
import { groupLoansByPerson } from "@/features/loans/lib/group-loans";
import {
  type Loan,
  type LoanCurrency,
  type LoanDirection,
} from "@/features/loans/types/loan-types";
import { formatCurrency } from "@/lib/format";

type LoansSummaryCardsProps = {
  loans: Loan[];
};

function pendingByCurrency(loans: Loan[], direction: LoanDirection) {
  const totals = new Map<LoanCurrency, number>();
  for (const loan of loans) {
    if (loan.isSettled || loan.direction !== direction) continue;
    totals.set(
      loan.currency,
      (totals.get(loan.currency) ?? 0) + loan.pendingAmount,
    );
  }
  return [...totals.entries()].filter(([, amount]) => amount > 0);
}

function formatAmounts(items: [LoanCurrency, number][]) {
  if (items.length === 0) return formatCurrency(0);
  return items
    .map(([currency, amount]) => formatCurrency(amount, currency))
    .join(" · ");
}

function netByCurrency(loans: Loan[]) {
  const totals = new Map<LoanCurrency, number>();
  for (const loan of loans) {
    if (loan.isSettled) continue;
    const signed =
      loan.direction === "lent" ? loan.pendingAmount : -loan.pendingAmount;
    totals.set(loan.currency, (totals.get(loan.currency) ?? 0) + signed);
  }
  return [...totals.entries()].filter(([, amount]) => amount !== 0);
}

export function LoansSummaryCards({ loans }: LoansSummaryCardsProps) {
  const groups = groupLoansByPerson(loans);
  const activeLent = groups.filter(
    (group) => !group.isSettled && group.direction === "lent",
  );
  const activeBorrowed = groups.filter(
    (group) => !group.isSettled && group.direction === "borrowed",
  );
  const toReceive = pendingByCurrency(loans, "lent");
  const toPay = pendingByCurrency(loans, "borrowed");
  const net = netByCurrency(loans);
  const isNetPositive = net.every(([, amount]) => amount >= 0);

  return (
    <SummaryMetricCards
      ariaLabel="Resumen de préstamos"
      cards={[
        {
          title: "Me deben",
          value: formatAmounts(toReceive),
          description: `${activeLent.length} ${activeLent.length === 1 ? "persona" : "personas"}`,
        },
        {
          title: "Debo",
          value: formatAmounts(toPay),
          description: `${activeBorrowed.length} ${activeBorrowed.length === 1 ? "persona" : "personas"}`,
        },
        {
          title: "Balance neto",
          value:
            net.length === 0
              ? formatCurrency(0)
              : net
                  .map(([currency, amount]) =>
                    formatCurrency(Math.abs(amount), currency),
                  )
                  .join(" · "),
          description: isNetPositive ? "A tu favor" : "Por moneda",
          emphasis: true,
          negative: !isNetPositive,
        },
      ]}
      columns={3}
    />
  );
}
