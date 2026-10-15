import { round2 } from "@/features/loans/lib/loan-interest";
import { formatCurrency } from "@/lib/format";
import {
  type Loan,
  type LoanCurrency,
  type LoanCurrencyTotal,
  type LoanDisbursement,
  type LoanMovementRow,
  type LoanPersonGroup,
} from "@/features/loans/types/loan-types";

export function normalizePersonName(name: string) {
  return name.trim().toLowerCase();
}

function currencyTotals(balances: Loan[]): LoanCurrencyTotal[] {
  const totals = new Map<LoanCurrency, LoanCurrencyTotal>();
  for (const loan of balances) {
    if (loan.isSettled) continue;
    const total = totals.get(loan.currency) ?? {
      currency: loan.currency,
      lent: 0,
      borrowed: 0,
      net: 0,
    };
    total[loan.direction] = round2(total[loan.direction] + loan.pendingAmount);
    total.net = round2(total.lent - total.borrowed);
    totals.set(loan.currency, total);
  }
  return [...totals.values()];
}

export function netLabel(total: LoanCurrencyTotal) {
  if (total.net === 0) return "A mano";
  const amount = formatCurrency(Math.abs(total.net), total.currency);
  return total.net > 0 ? `Te debe ${amount}` : `Le debes ${amount}`;
}

export function groupLoansByPerson(loans: Loan[]): LoanPersonGroup[] {
  const groups = new Map<string, LoanPersonGroup>();

  for (const loan of loans) {
    const key = normalizePersonName(loan.personName);
    const existing = groups.get(key);
    if (existing) {
      existing.balances.push(loan);
      existing.isSettled = existing.isSettled && loan.isSettled;
      continue;
    }
    groups.set(key, {
      key,
      personName: loan.personName,
      balances: [loan],
      totals: [],
      isSettled: loan.isSettled,
    });
  }

  return [...groups.values()].map((group) => ({
    ...group,
    totals: currencyTotals(group.balances),
  }));
}

export function allocateOffset(
  disbursements: LoanDisbursement[],
  amount: number,
): { disbursementId: string; amount: number }[] {
  const allocations: { disbursementId: string; amount: number }[] = [];
  let remaining = round2(amount);
  const open = disbursements
    .filter((disbursement) => disbursement.outstandingAmount > 0)
    .toSorted((a, b) => a.occurredOn.localeCompare(b.occurredOn));

  for (const disbursement of open) {
    if (remaining <= 0) break;
    const applied = round2(Math.min(remaining, disbursement.outstandingAmount));
    allocations.push({ disbursementId: disbursement.id, amount: applied });
    remaining = round2(remaining - applied);
  }

  return allocations;
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
        expectedOn: loan.expectedOn,
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
        expectedOn: loan.expectedOn,
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
