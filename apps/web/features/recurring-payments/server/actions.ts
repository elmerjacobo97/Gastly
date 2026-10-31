"use server";

import { revalidatePath } from "next/cache";
import {
  addMonths,
  addYears,
  endOfMonth,
  format,
  isLastDayOfMonth,
} from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { parseOrThrow } from "@/lib/validation";
import {
  reactivateRecurringPaymentSchema,
  recurringPaymentActiveSchema,
  recurringPaymentIdSchema,
  recurringPaymentPaymentSchema,
  recurringPaymentRefSchema,
  recurringPaymentSchema,
  type ReactivateRecurringPaymentValues,
  type RecurringPaymentPaymentValues,
  type RecurringPaymentValues,
} from "@/features/recurring-payments/schemas/recurring-payment-schemas";
import { type RecurringPayment } from "@/lib/recurring-payment-types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Debes iniciar sesión.");
  }

  return { supabase, userId: user.id };
}

function revalidateRecurring() {
  revalidatePath("/recurring-payments");
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
}

function getNextDueDate(
  currentDate: string,
  frequency: RecurringPayment["frequency"],
  intervalMonths: number,
) {
  const date = new Date(`${currentDate}T12:00:00`);
  if (frequency === "yearly") return format(addYears(date, 1), "yyyy-MM-dd");
  const next = addMonths(date, frequency === "monthly" ? 1 : intervalMonths);
  // Month-end dues stay at month end (30 Sep -> 31 Oct, not 30 Oct).
  return format(isLastDayOfMonth(date) ? endOfMonth(next) : next, "yyyy-MM-dd");
}

function getIntervalMonths(values: {
  frequency: RecurringPayment["frequency"];
  intervalMonths: number;
}) {
  if (values.frequency === "custom_months") return values.intervalMonths;
  return values.frequency === "yearly" ? 12 : 1;
}

export async function createRecurringPayment(
  rawValues: RecurringPaymentValues,
) {
  const values = parseOrThrow(recurringPaymentSchema, rawValues);
  const { supabase, userId } = await requireUser();

  const { error } = await supabase.from("recurring_expenses").insert({
    user_id: userId,
    category_id: values.categoryId,
    amount: values.amount,
    currency: values.currency,
    description: values.description,
    frequency: values.frequency,
    interval_months:
      values.frequency === "custom_months"
        ? values.intervalMonths
        : values.frequency === "yearly"
          ? 12
          : 1,
    payment_kind: values.paymentKind,
    next_due_on: values.nextDueOn,
    billing_day: new Date(`${values.nextDueOn}T12:00:00`).getDate(),
    notes: values.notes || null,
    is_active: true,
    account_id: values.accountId || null,
    type: values.type ?? "expense",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateRecurring();
}

export async function updateRecurringPayment(
  rawId: string,
  rawValues: RecurringPaymentValues,
) {
  const id = parseOrThrow(recurringPaymentIdSchema, rawId);
  const values = parseOrThrow(recurringPaymentSchema, rawValues);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("recurring_expenses")
    .update({
      category_id: values.categoryId,
      amount: values.amount,
      currency: values.currency,
      description: values.description,
      frequency: values.frequency,
      interval_months: getIntervalMonths(values),
      payment_kind: values.paymentKind,
      next_due_on: values.nextDueOn,
      billing_day: new Date(`${values.nextDueOn}T12:00:00`).getDate(),
      notes: values.notes || null,
      account_id: values.accountId || null,
      type: values.type ?? "expense",
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateRecurring();
}

export async function reactivateRecurringPayment(
  rawId: string,
  rawValues: ReactivateRecurringPaymentValues,
) {
  const id = parseOrThrow(recurringPaymentIdSchema, rawId);
  const values = parseOrThrow(reactivateRecurringPaymentSchema, rawValues);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("recurring_expenses")
    .update({
      is_active: true,
      amount: values.amount,
      currency: values.currency,
      frequency: values.frequency,
      interval_months: getIntervalMonths(values),
      next_due_on: values.nextDueOn,
      billing_day: new Date(`${values.nextDueOn}T12:00:00`).getDate(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateRecurring();
}

export async function setRecurringPaymentActive(
  rawId: string,
  rawIsActive: boolean,
) {
  const id = parseOrThrow(recurringPaymentIdSchema, rawId);
  const isActive = parseOrThrow(recurringPaymentActiveSchema, rawIsActive);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("recurring_expenses")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateRecurring();
}

export async function deleteRecurringPayment(rawId: string) {
  const id = parseOrThrow(recurringPaymentIdSchema, rawId);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("recurring_expenses")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateRecurring();
}

export async function registerRecurringPaymentPayment(
  rawPayment: RecurringPayment,
  rawValues: RecurringPaymentPaymentValues,
) {
  const payment = parseOrThrow(recurringPaymentRefSchema, rawPayment);
  const values = parseOrThrow(recurringPaymentPaymentSchema, rawValues);

  if (!payment.category) {
    throw new Error(
      "El pago recurrente necesita una categoria para registrar el pago.",
    );
  }

  const { supabase, userId } = await requireUser();

  const { data: account } = payment.accountId
    ? await supabase
        .from("accounts")
        .select("currency")
        .eq("id", payment.accountId)
        .single()
    : { data: null };

  const needsAccountAmount = !!account && account.currency !== values.currency;
  if (needsAccountAmount && !values.accountAmount) {
    throw new Error(
      `Ingresa el monto cobrado en ${account.currency} para actualizar el saldo.`,
    );
  }
  const accountAmount = needsAccountAmount ? values.accountAmount : undefined;
  const balanceAmount = accountAmount ?? values.amount;

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    category_id: payment.category.id,
    recurring_expense_id: payment.id,
    type: payment.type === "income" ? "income" : "expense",
    amount: values.amount,
    currency: values.currency,
    account_id: payment.accountId,
    account_amount: accountAmount ?? null,
    description: payment.description,
    occurred_on: values.occurredOn,
    notes: values.notes || payment.notes,
  });

  if (error) {
    throw new Error(error.message);
  }

  const nextDueOn = getNextDueDate(
    payment.nextDueOn,
    payment.frequency,
    payment.intervalMonths,
  );

  const { error: updateError } = await supabase
    .from("recurring_expenses")
    .update({
      next_due_on: nextDueOn,
      billing_day: new Date(`${nextDueOn}T12:00:00`).getDate(),
    })
    .eq("id", payment.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  // Balance moves in the account's currency: the amount charged when currencies differ, else the payment amount.
  if (payment.accountId) {
    const rpcFn =
      payment.type === "income"
        ? "increment_account_balance"
        : "decrement_account_balance";
    const { error: balanceError } = await supabase.rpc(rpcFn, {
      p_account_id: payment.accountId,
      p_amount: balanceAmount,
    });
    if (balanceError) throw new Error(balanceError.message);
  }

  revalidateRecurring();
}
