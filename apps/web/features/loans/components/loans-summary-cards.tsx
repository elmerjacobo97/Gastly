"use client";

import { SummaryMetricCards } from "@/components/summary-metric-cards";
import { groupLoansByPerson } from "@/features/loans/lib/group-loans";
import {
  type Loan,
  type LoanCurrency,
  type LoanPersonGroup,
} from "@/features/loans/types/loan-types";
import { formatCurrency } from "@/lib/format";

type LoansSummaryCardsProps = {
  loans: Loan[];
};

function sideByCurrency(groups: LoanPersonGroup[], sign: 1 | -1) {
  const totals = new Map<LoanCurrency, number>();
  for (const group of groups) {
    for (const total of group.totals) {
      const amount = total.net * sign;
      if (amount <= 0) continue;
      totals.set(total.currency, (totals.get(total.currency) ?? 0) + amount);
    }
  }
  return [...totals.entries()];
}

function countPeople(groups: LoanPersonGroup[], sign: 1 | -1) {
  return groups.filter((group) =>
    group.totals.some((total) => total.net * sign > 0),
  ).length;
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
  const owedCount = countPeople(groups, 1);
  const oweCount = countPeople(groups, -1);
  const toReceive = sideByCurrency(groups, 1);
  const toPay = sideByCurrency(groups, -1);
  const net = netByCurrency(loans);
  const isNetPositive = net.every(([, amount]) => amount >= 0);

  return (
    <SummaryMetricCards
      ariaLabel="Resumen de préstamos"
      cards={[
        {
          title: "Me deben",
          value: formatAmounts(toReceive),
          description: `${owedCount} ${owedCount === 1 ? "persona" : "personas"}`,
        },
        {
          title: "Debo",
          value: formatAmounts(toPay),
          description: `${oweCount} ${oweCount === 1 ? "persona" : "personas"}`,
        },
        {
          title: "Balance neto",
          value:
            net.length === 0
              ? formatCurrency(0)
              : net
                  .map(
                    ([currency, amount]) =>
                      `${amount < 0 ? "-" : "+"}${formatCurrency(Math.abs(amount), currency)}`,
                  )
                  .join(" · "),
          description: isNetPositive
            ? "A tu favor"
            : "+ a tu favor · − en tu contra",
          negative: !isNetPositive,
        },
      ]}
      columns={3}
    />
  );
}
