import { createClient } from "@/lib/supabase/server"
import {
  type Loan,
  type LoanCurrency,
  type LoanDirection,
  type LoanDisbursement,
  type LoanPayment,
} from "@/features/loans/types/loan-types"

type LoanRow = {
  id: string
  person_name: string
  direction: LoanDirection
  currency: LoanCurrency
  amount: number | string
  expected_on: string | null
  loaned_on: string
  notes: string | null
}

type LoanPaymentRow = {
  id: string
  loan_id: string
  amount: number | string
  occurred_on: string
  notes: string | null
}

type LoanDisbursementRow = {
  id: string
  loan_id: string
  amount: number | string
  occurred_on: string
  notes: string | null
}

function mapPayment(row: LoanPaymentRow): LoanPayment {
  return {
    id: row.id,
    loanId: row.loan_id,
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
    notes: row.notes,
  }
}

function mapDisbursement(row: LoanDisbursementRow): LoanDisbursement {
  return {
    id: row.id,
    loanId: row.loan_id,
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
    notes: row.notes,
  }
}

function mapLoan(
  row: LoanRow,
  disbursements: LoanDisbursement[],
  payments: LoanPayment[]
): Loan {
  const amount = disbursements.reduce((sum, item) => sum + item.amount, 0)
  const paidAmount = payments.reduce((sum, item) => sum + item.amount, 0)
  const pendingAmount = Math.max(0, amount - paidAmount)
  return {
    id: row.id,
    personName: row.person_name,
    direction: row.direction,
    currency: row.currency,
    amount,
    expectedOn: row.expected_on,
    loanedOn: row.loaned_on,
    notes: row.notes,
    disbursements,
    payments,
    paidAmount,
    pendingAmount,
    isSettled: pendingAmount <= 0,
  }
}

export async function getLoans(): Promise<Loan[]> {
  const supabase = await createClient()

  const { data: loans, error } = await supabase
    .from("loans")
    .select("id, person_name, direction, currency, amount, expected_on, loaned_on, notes")
    .order("created_at", { ascending: false })
    .overrideTypes<LoanRow[], { merge: false }>()

  if (error) throw new Error(error.message)
  if (!loans?.length) return []

  const loanIds = loans.map((loan) => loan.id)

  const [paymentsResult, disbursementsResult] = await Promise.all([
    supabase
      .from("loan_payments")
      .select("id, loan_id, amount, occurred_on, notes")
      .in("loan_id", loanIds)
      .order("occurred_on", { ascending: false })
      .overrideTypes<LoanPaymentRow[], { merge: false }>(),
    supabase
      .from("loan_disbursements")
      .select("id, loan_id, amount, occurred_on, notes")
      .in("loan_id", loanIds)
      .order("occurred_on", { ascending: false })
      .overrideTypes<LoanDisbursementRow[], { merge: false }>(),
  ])

  if (paymentsResult.error) throw new Error(paymentsResult.error.message)
  if (disbursementsResult.error) throw new Error(disbursementsResult.error.message)

  const paymentsByLoan = new Map<string, LoanPayment[]>()
  for (const row of paymentsResult.data ?? []) {
    const list = paymentsByLoan.get(row.loan_id) ?? []
    list.push(mapPayment(row))
    paymentsByLoan.set(row.loan_id, list)
  }

  const disbursementsByLoan = new Map<string, LoanDisbursement[]>()
  for (const row of disbursementsResult.data ?? []) {
    const list = disbursementsByLoan.get(row.loan_id) ?? []
    list.push(mapDisbursement(row))
    disbursementsByLoan.set(row.loan_id, list)
  }

  return loans.map((loan) =>
    mapLoan(loan, disbursementsByLoan.get(loan.id) ?? [], paymentsByLoan.get(loan.id) ?? [])
  )
}
