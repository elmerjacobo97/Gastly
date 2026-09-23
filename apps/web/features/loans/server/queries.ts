import "server-only";

import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { computeLoanInterest } from "@/features/loans/lib/loan-interest";
import {
  type Loan,
  type LoanCurrency,
  type LoanDirection,
  type LoanDisbursement,
  type LoanPayment,
} from "@/features/loans/types/loan-types";

type LoanRow = {
  id: string;
  person_name: string;
  direction: LoanDirection;
  currency: LoanCurrency;
  expected_on: string | null;
  notes: string | null;
};

type LoanPaymentRow = {
  id: string;
  loan_id: string;
  disbursement_id: string;
  amount: number | string;
  occurred_on: string;
  notes: string | null;
};

type LoanDisbursementRow = {
  id: string;
  loan_id: string;
  amount: number | string;
  occurred_on: string;
  description: string | null;
  notes: string | null;
  interest_rate: number | string;
};

function mapPayment(row: LoanPaymentRow): LoanPayment {
  return {
    id: row.id,
    loanId: row.loan_id,
    disbursementId: row.disbursement_id,
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
    notes: row.notes,
  };
}

function mapDisbursement(row: LoanDisbursementRow): LoanDisbursement {
  return {
    id: row.id,
    loanId: row.loan_id,
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
    description: row.description,
    notes: row.notes,
    interestRate: Number(row.interest_rate ?? 0),
    outstandingAmount: 0,
  };
}

function mapLoan(
  row: LoanRow,
  disbursements: LoanDisbursement[],
  payments: LoanPayment[],
  asOf: string,
): Loan {
  const interest = computeLoanInterest(disbursements, payments, asOf);
  const outstandingByDisbursement = new Map(
    interest.disbursements.map((item) => [item.id, item.outstanding]),
  );
  const mappedDisbursements = disbursements.map((disbursement) => ({
    ...disbursement,
    outstandingAmount:
      outstandingByDisbursement.get(disbursement.id) ?? disbursement.amount,
  }));
  return {
    id: row.id,
    personName: row.person_name,
    direction: row.direction,
    currency: row.currency,
    expectedOn: row.expected_on,
    notes: row.notes,
    disbursements: mappedDisbursements,
    payments,
    accruedInterest: interest.accruedInterest,
    pendingAmount: interest.totalDue,
    isSettled: interest.totalDue <= 0,
  };
}

export async function getLoans(): Promise<Loan[]> {
  const supabase = await createClient();

  const { data: loans, error } = await supabase
    .from("loans")
    .select("id, person_name, direction, currency, expected_on, notes")
    .order("created_at", { ascending: false })
    .overrideTypes<LoanRow[], { merge: false }>();

  if (error) throw new Error(error.message);
  if (!loans?.length) return [];

  const loanIds = loans.map((loan) => loan.id);
  const asOf = format(new Date(), "yyyy-MM-dd");

  const [paymentsResult, disbursementsResult] = await Promise.all([
    supabase
      .from("loan_payments")
      .select("id, loan_id, disbursement_id, amount, occurred_on, notes")
      .in("loan_id", loanIds)
      .order("occurred_on", { ascending: false })
      .overrideTypes<LoanPaymentRow[], { merge: false }>(),
    supabase
      .from("loan_disbursements")
      .select(
        "id, loan_id, amount, occurred_on, description, notes, interest_rate",
      )
      .in("loan_id", loanIds)
      .order("occurred_on", { ascending: false })
      .overrideTypes<LoanDisbursementRow[], { merge: false }>(),
  ]);

  if (paymentsResult.error) throw new Error(paymentsResult.error.message);
  if (disbursementsResult.error)
    throw new Error(disbursementsResult.error.message);

  const paymentsByLoan = new Map<string, LoanPayment[]>();
  for (const row of paymentsResult.data ?? []) {
    const list = paymentsByLoan.get(row.loan_id) ?? [];
    list.push(mapPayment(row));
    paymentsByLoan.set(row.loan_id, list);
  }

  const disbursementsByLoan = new Map<string, LoanDisbursement[]>();
  for (const row of disbursementsResult.data ?? []) {
    const list = disbursementsByLoan.get(row.loan_id) ?? [];
    list.push(mapDisbursement(row));
    disbursementsByLoan.set(row.loan_id, list);
  }

  return loans.map((loan) =>
    mapLoan(
      loan,
      disbursementsByLoan.get(loan.id) ?? [],
      paymentsByLoan.get(loan.id) ?? [],
      asOf,
    ),
  );
}
