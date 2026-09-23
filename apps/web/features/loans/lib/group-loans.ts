import {
  type Loan,
  type LoanMovementRow,
  type LoanPersonGroup,
} from "@/features/loans/types/loan-types";

export function normalizePersonName(name: string) {
  return name.trim().toLowerCase();
}

export function groupLoansByPerson(loans: Loan[]): LoanPersonGroup[] {
  const groups = new Map<string, LoanPersonGroup>();

  for (const loan of loans) {
    const key = `${loan.direction}:${normalizePersonName(loan.personName)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.balances.push(loan);
      existing.isSettled = existing.isSettled && loan.isSettled;
      continue;
    }
    groups.set(key, {
      key,
      personName: loan.personName,
      direction: loan.direction,
      balances: [loan],
      isSettled: loan.isSettled,
    });
  }

  return [...groups.values()];
}

export function uniquePersonNames(loans: Loan[]) {
  const names = new Set<string>();
  for (const loan of loans) {
    names.add(loan.personName);
  }
  return [...names].toSorted((a, b) => a.localeCompare(b, "es"));
}

export function flattenLoanMovements(loans: Loan[]): LoanMovementRow[] {
  return loans
    .flatMap((loan) => [
      ...loan.disbursements.map((disbursement): LoanMovementRow => ({
        id: disbursement.id,
        kind: "disbursement",
        loanId: loan.id,
        personName: loan.personName,
        direction: loan.direction,
        currency: loan.currency,
        amount: disbursement.amount,
        occurredOn: disbursement.occurredOn,
        description: disbursement.description,
        notes: disbursement.notes,
        isSettled: disbursement.outstandingAmount <= 0,
        pendingAmount: disbursement.outstandingAmount,
        interestRate: disbursement.interestRate,
      })),
      ...loan.payments.map((payment): LoanMovementRow => ({
        id: payment.id,
        kind: "payment",
        loanId: loan.id,
        personName: loan.personName,
        direction: loan.direction,
        currency: loan.currency,
        amount: payment.amount,
        occurredOn: payment.occurredOn,
        description:
          loan.disbursements.find(
            (disbursement) => disbursement.id === payment.disbursementId,
          )?.description ?? null,
        notes: payment.notes,
        isSettled: loan.isSettled,
        pendingAmount: 0,
        interestRate: 0,
      })),
    ])
    .toSorted((a, b) => {
      const byDate = b.occurredOn.localeCompare(a.occurredOn);
      if (byDate !== 0) return byDate;
      return a.kind.localeCompare(b.kind);
    });
}
