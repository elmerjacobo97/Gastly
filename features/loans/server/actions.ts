"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { computeLoanInterest } from "@/features/loans/lib/loan-interest";
import {
  type EditLoanPersonValues,
  type LoanDisbursementValues,
  type LoanPaymentValues,
  type LoanValues,
} from "@/features/loans/schemas/loan-schemas";
import { normalizePersonName } from "@/features/loans/lib/group-loans";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Debes iniciar sesión.");

  return { supabase, userId: user.id };
}

function revalidateLoans() {
  revalidatePath("/dashboard/loans");
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;

async function validateLoanPayment(
  supabase: ServerClient,
  disbursementId: string,
  values: LoanPaymentValues,
  excludedPaymentId?: string,
) {
  const { data: disbursement, error: disbursementError } = await supabase
    .from("loan_disbursements")
    .select("id, amount, occurred_on, interest_rate")
    .eq("id", disbursementId)
    .single();

  if (disbursementError || !disbursement) {
    throw new Error(disbursementError?.message ?? "Préstamo no encontrado.");
  }
  if (values.occurredOn < disbursement.occurred_on) {
    throw new Error("La devolución no puede ser anterior al préstamo.");
  }

  let paymentsQuery = supabase
    .from("loan_payments")
    .select("id, disbursement_id, amount, occurred_on")
    .eq("disbursement_id", disbursementId);
  if (excludedPaymentId) {
    paymentsQuery = paymentsQuery.neq("id", excludedPaymentId);
  }

  const { data: payments, error: paymentsError } = await paymentsQuery;
  if (paymentsError) throw new Error(paymentsError.message);

  const paymentInputs = (payments ?? []).map((payment) => ({
    id: payment.id,
    disbursementId: payment.disbursement_id,
    amount: Number(payment.amount),
    occurredOn: payment.occurred_on,
  }));
  paymentInputs.push({
    id: excludedPaymentId ?? "new-payment",
    disbursementId,
    amount: values.amount,
    occurredOn: values.occurredOn,
  });
  const asOf = paymentInputs.reduce(
    (latest, payment) =>
      payment.occurredOn > latest ? payment.occurredOn : latest,
    values.occurredOn,
  );
  const summary = computeLoanInterest(
    [
      {
        id: disbursement.id,
        amount: Number(disbursement.amount),
        occurredOn: disbursement.occurred_on,
        interestRate: Number(disbursement.interest_rate ?? 0),
      },
    ],
    paymentInputs,
    asOf,
  );

  if (summary.unappliedAmount > 0) {
    throw new Error("El monto supera el saldo pendiente de este préstamo.");
  }
}

async function syncLoanTotals(supabase: ServerClient, loanId: string) {
  const { data, error } = await supabase
    .from("loan_disbursements")
    .select("amount, occurred_on")
    .eq("loan_id", loanId);

  if (error) throw new Error(error.message);

  const amount = (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  let loanedOn = data?.[0]?.occurred_on ?? null;
  for (const row of data ?? []) {
    if (!loanedOn || row.occurred_on < loanedOn) loanedOn = row.occurred_on;
  }

  const { error: updateError } = await supabase
    .from("loans")
    .update({ amount, loaned_on: loanedOn })
    .eq("id", loanId);
  if (updateError) throw new Error(updateError.message);
}

export async function createLoan(values: LoanValues): Promise<void> {
  const { supabase, userId } = await requireUser();
  const personName = values.personName.trim();
  const normalized = normalizePersonName(personName);

  const { data: existing, error: existingError } = await supabase
    .from("loans")
    .select("id, person_name")
    .eq("user_id", userId)
    .eq("direction", values.direction)
    .eq("currency", values.currency);

  if (existingError) throw new Error(existingError.message);

  const match = existing?.find(
    (loan) => normalizePersonName(loan.person_name) === normalized,
  );

  if (match) {
    const { error } = await supabase.from("loan_disbursements").insert({
      loan_id: match.id,
      amount: values.amount,
      occurred_on: values.loanedOn,
      description: values.description || null,
      notes: values.notes || null,
      interest_rate: values.interestRate ?? 0,
    });
    if (error) throw new Error(error.message);

    await syncLoanTotals(supabase, match.id);

    if (values.expectedOn) {
      const { error: expectedError } = await supabase
        .from("loans")
        .update({ expected_on: values.expectedOn })
        .eq("id", match.id);
      if (expectedError) throw new Error(expectedError.message);
    }

    revalidateLoans();
    return;
  }

  const { data: loan, error } = await supabase
    .from("loans")
    .insert({
      user_id: userId,
      direction: values.direction,
      person_name: personName,
      amount: values.amount,
      currency: values.currency,
      expected_on: values.expectedOn || null,
      loaned_on: values.loanedOn,
      notes: values.notes || null,
    })
    .select("id")
    .single();

  if (error || !loan)
    throw new Error(error?.message ?? "No se pudo registrar el préstamo.");

  const { error: disbursementError } = await supabase
    .from("loan_disbursements")
    .insert({
      loan_id: loan.id,
      amount: values.amount,
      occurred_on: values.loanedOn,
      description: values.description || null,
      notes: values.notes || null,
      interest_rate: values.interestRate ?? 0,
    });

  if (disbursementError) {
    await supabase.from("loans").delete().eq("id", loan.id);
    throw new Error(disbursementError.message);
  }

  revalidateLoans();
}

export async function updateLoanPerson(
  ids: string[],
  values: EditLoanPersonValues,
): Promise<void> {
  const { supabase } = await requireUser();
  if (ids.length === 0) throw new Error("No hay préstamos para actualizar.");

  const { error } = await supabase
    .from("loans")
    .update({
      person_name: values.personName.trim(),
      expected_on: values.expectedOn || null,
      notes: values.notes || null,
    })
    .in("id", ids);
  if (error) throw new Error(error.message);
  revalidateLoans();
}

export async function deleteLoanBalances(ids: string[]): Promise<void> {
  const { supabase } = await requireUser();
  if (ids.length === 0) return;

  const { error } = await supabase.from("loans").delete().in("id", ids);
  if (error) throw new Error(error.message);
  revalidateLoans();
}

export async function recordLoanPayment(
  loanId: string,
  disbursementId: string,
  values: LoanPaymentValues,
): Promise<void> {
  const { supabase } = await requireUser();
  await validateLoanPayment(supabase, disbursementId, values);

  const { error } = await supabase.from("loan_payments").insert({
    loan_id: loanId,
    disbursement_id: disbursementId,
    amount: values.amount,
    occurred_on: values.occurredOn,
    notes: values.notes || null,
  });
  if (error) throw new Error(error.message);
  revalidateLoans();
}

export async function updateLoanPayment(
  id: string,
  values: LoanPaymentValues,
): Promise<void> {
  const { supabase } = await requireUser();

  const { data: payment, error: paymentError } = await supabase
    .from("loan_payments")
    .select("disbursement_id")
    .eq("id", id)
    .single();
  if (paymentError || !payment) {
    throw new Error(paymentError?.message ?? "Devolución no encontrada.");
  }

  await validateLoanPayment(supabase, payment.disbursement_id, values, id);

  const { error } = await supabase
    .from("loan_payments")
    .update({
      amount: values.amount,
      occurred_on: values.occurredOn,
      notes: values.notes || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateLoans();
}

export async function deleteLoanPayment(id: string): Promise<void> {
  const { supabase } = await requireUser();

  const { error } = await supabase.from("loan_payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateLoans();
}

export async function updateLoanDisbursement(
  id: string,
  values: LoanDisbursementValues,
): Promise<void> {
  const { supabase } = await requireUser();

  const { data: row, error: fetchError } = await supabase
    .from("loan_disbursements")
    .select("loan_id")
    .eq("id", id)
    .single();
  if (fetchError || !row)
    throw new Error(fetchError?.message ?? "Préstamo no encontrado.");

  const { data: payments, error: paymentsError } = await supabase
    .from("loan_payments")
    .select("id, disbursement_id, amount, occurred_on")
    .eq("disbursement_id", id);
  if (paymentsError) throw new Error(paymentsError.message);

  const paymentInputs = (payments ?? []).map((payment) => ({
    id: payment.id,
    disbursementId: payment.disbursement_id,
    amount: Number(payment.amount),
    occurredOn: payment.occurred_on,
  }));
  if (paymentInputs.some((payment) => payment.occurredOn < values.occurredOn)) {
    throw new Error("El préstamo no puede ser posterior a sus devoluciones.");
  }
  const asOf = paymentInputs.reduce(
    (latest, payment) =>
      payment.occurredOn > latest ? payment.occurredOn : latest,
    values.occurredOn,
  );
  const summary = computeLoanInterest(
    [
      {
        id,
        amount: values.amount,
        occurredOn: values.occurredOn,
        interestRate: values.interestRate,
      },
    ],
    paymentInputs,
    asOf,
  );
  if (summary.unappliedAmount > 0) {
    throw new Error("Los cambios dejarían devoluciones mayores al préstamo.");
  }

  const { error } = await supabase
    .from("loan_disbursements")
    .update({
      amount: values.amount,
      occurred_on: values.occurredOn,
      description: values.description || null,
      notes: values.notes || null,
      interest_rate: values.interestRate ?? 0,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await syncLoanTotals(supabase, row.loan_id);
  revalidateLoans();
}

export async function deleteLoanDisbursement(id: string): Promise<void> {
  const { supabase } = await requireUser();

  const { data: row, error: fetchError } = await supabase
    .from("loan_disbursements")
    .select("loan_id")
    .eq("id", id)
    .single();
  if (fetchError || !row)
    throw new Error(fetchError?.message ?? "Préstamo no encontrado.");

  const { count: paymentCount, error: paymentCountError } = await supabase
    .from("loan_payments")
    .select("id", { count: "exact", head: true })
    .eq("disbursement_id", id);
  if (paymentCountError) throw new Error(paymentCountError.message);
  if ((paymentCount ?? 0) > 0) {
    throw new Error(
      "No se puede eliminar un préstamo con devoluciones registradas.",
    );
  }

  const { count, error: countError } = await supabase
    .from("loan_disbursements")
    .select("id", { count: "exact", head: true })
    .eq("loan_id", row.loan_id);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) <= 1) {
    throw new Error(
      "No se puede eliminar el único préstamo de este saldo. Elimina la cuenta.",
    );
  }

  const { error } = await supabase
    .from("loan_disbursements")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);

  await syncLoanTotals(supabase, row.loan_id);
  revalidateLoans();
}
