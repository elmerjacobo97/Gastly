"use client";

import { AlertTriangleIcon, XCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { groupLoansByPerson } from "@/features/loans/lib/group-loans";
import {
  dueSoonLabel,
  getLoanDue,
  type LoanDue,
} from "@/features/loans/lib/loan-due";
import {
  type Loan,
  type LoanCurrencyTotal,
} from "@/features/loans/types/loan-types";
import { formatCurrency, formatDate } from "@/lib/format";

type LoanDueAlertsProps = {
  loans: Loan[];
};

type DuePerson = {
  personName: string;
  totals: LoanCurrencyTotal[];
  expectedOn: string;
  days: number;
};

function duePeople(
  loans: Loan[],
  status: LoanDue["status"],
  today: Date,
): DuePerson[] {
  return groupLoansByPerson(loans).flatMap((group) => {
    const due = group.balances.flatMap((loan) => {
      if (loan.isSettled || !loan.expectedOn) return [];
      const dueInfo = getLoanDue(loan.expectedOn, today);
      if (dueInfo.status !== status) return [];
      return [{ loan, expectedOn: loan.expectedOn, days: dueInfo.days }];
    });
    const totals = group.totals.filter(
      (total) =>
        total.net !== 0 &&
        due.some((item) => item.loan.currency === total.currency),
    );
    if (totals.length === 0) return [];

    const earliest = due.reduce((a, b) => (b.days < a.days ? b : a));
    return [
      {
        personName: group.personName,
        totals,
        expectedOn: earliest.expectedOn,
        days: earliest.days,
      },
    ];
  });
}

function joinAmounts(totals: LoanCurrencyTotal[]) {
  return totals
    .map((total) => formatCurrency(Math.abs(total.net), total.currency))
    .join(" y ");
}

function describePerson({ personName, totals }: DuePerson) {
  const owed = totals.filter((total) => total.net > 0);
  const owe = totals.filter((total) => total.net < 0);
  return [
    owed.length > 0 && `${personName} te debe ${joinAmounts(owed)}`,
    owe.length > 0 && `Debes ${joinAmounts(owe)} a ${personName}`,
  ]
    .filter(Boolean)
    .join("; ");
}

export function LoanDueAlerts({ loans }: LoanDueAlertsProps) {
  const today = new Date();
  const overdue = duePeople(loans, "overdue", today);
  const soon = duePeople(loans, "soon", today);

  if (overdue.length === 0 && soon.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {overdue.length > 0 && (
        <Alert variant="destructive">
          <XCircleIcon />
          <AlertTitle>
            {overdue.length === 1
              ? "Préstamo vencido"
              : `${overdue.length} préstamos vencidos`}
          </AlertTitle>
          <AlertDescription>
            {overdue
              .map(
                (person) =>
                  `${describePerson(person)} · vencía el ${formatDate(person.expectedOn)}`,
              )
              .join("; ")}
          </AlertDescription>
        </Alert>
      )}
      {soon.length > 0 && (
        <Alert variant="warning">
          <AlertTriangleIcon />
          <AlertTitle>
            {soon.length === 1
              ? "Préstamo por vencer"
              : `${soon.length} préstamos por vencer`}
          </AlertTitle>
          <AlertDescription>
            {soon
              .map(
                (person) =>
                  `${describePerson(person)} · ${dueSoonLabel(person.days)}`,
              )
              .join("; ")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
