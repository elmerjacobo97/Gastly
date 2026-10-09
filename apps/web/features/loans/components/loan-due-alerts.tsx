"use client";

import { AlertTriangleIcon, XCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { groupLoansByPerson } from "@/features/loans/lib/group-loans";
import {
  dueSoonLabel,
  getLoanDue,
  type LoanDue,
} from "@/features/loans/lib/loan-due";
import { type Loan } from "@/features/loans/types/loan-types";
import { formatCurrency, formatDate } from "@/lib/format";

type LoanDueAlertsProps = {
  loans: Loan[];
};

type DuePerson = {
  personName: string;
  direction: Loan["direction"];
  balances: Loan[];
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
    if (due.length === 0) return [];

    const earliest = due.reduce((a, b) => (b.days < a.days ? b : a));
    return [
      {
        personName: group.personName,
        direction: group.direction,
        balances: due.map((item) => item.loan),
        expectedOn: earliest.expectedOn,
        days: earliest.days,
      },
    ];
  });
}

function describePerson({ personName, direction, balances }: DuePerson) {
  const amount = balances
    .map((loan) => formatCurrency(loan.pendingAmount, loan.currency))
    .join(" y ");
  return direction === "lent"
    ? `${personName} te debe ${amount}`
    : `Debes ${amount} a ${personName}`;
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
