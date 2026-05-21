import { createClient } from "@/lib/supabase/browser"
import { type Loan, type LoanCurrency, type LoanDirection, type LoanPayment } from "@/features/loans/types/loan-types"
import { type LoanValues, type LoanPaymentValues } from "@/features/loans/schemas/loan-schemas"

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

function mapPayment(row: LoanPaymentRow): LoanPayment {
  return {
    id: row.id,
    loanId: row.loan_id,
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
    notes: row.notes,
  }
}

function mapLoan(row: LoanRow, payments: LoanPayment[]): Loan {
  const paidAmount = payments.reduce((s, p) => s + p.amount, 0)
  const amount = Number(row.amount)
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
    payments,
    paidAmount,
    pendingAmount,
    isSettled: pendingAmount <= 0,
  }
}

export async function getLoans(): Promise<Loan[]> {
  const supabase = createClient()

  const { data: loans, error } = await supabase
    .from("loans")
    .select("id, person_name, direction, currency, amount, expected_on, loaned_on, notes")
    .order("created_at", { ascending: false })
    .returns<LoanRow[]>()

  if (error) throw new Error(error.message)
  if (!loans?.length) return []

  const { data: payments, error: pError } = await supabase
    .from("loan_payments")
    .select("id, loan_id, amount, occurred_on, notes")
    .in("loan_id", loans.map((l) => l.id))
    .order("occurred_on", { ascending: true })
    .returns<LoanPaymentRow[]>()

  if (pError) throw new Error(pError.message)

  const byLoan = new Map<string, LoanPayment[]>()
  for (const row of payments ?? []) {
    const list = byLoan.get(row.loan_id) ?? []
    list.push(mapPayment(row))
    byLoan.set(row.loan_id, list)
  }

  return loans.map((l) => mapLoan(l, byLoan.get(l.id) ?? []))
}

export async function createLoan(values: LoanValues): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  const { error } = await supabase.from("loans").insert({
    user_id: user.id,
    direction: values.direction,
    currency: values.currency,
    person_name: values.personName,
    amount: values.amount,
    expected_on: values.expectedOn || null,
    loaned_on: values.loanedOn,
    notes: values.notes || null,
  })

  if (error) throw new Error(error.message)
}

export async function updateLoan(id: string, values: LoanValues): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  const { error } = await supabase
    .from("loans")
    .update({
      direction: values.direction,
      currency: values.currency,
      person_name: values.personName,
      amount: values.amount,
      expected_on: values.expectedOn || null,
      loaned_on: values.loanedOn,
      notes: values.notes || null,
    })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deleteLoan(id: string): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  const { error } = await supabase.from("loans").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function recordLoanPayment(
  loanId: string,
  values: LoanPaymentValues
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("loan_payments").insert({
    loan_id: loanId,
    amount: values.amount,
    occurred_on: values.occurredOn,
    notes: values.notes || null,
  })
  if (error) throw new Error(error.message)
}
