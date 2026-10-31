"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { type TransactionType } from "@/lib/transaction-types";
import { parseOrThrow } from "@/lib/validation";
import {
  transactionIdSchema,
  transactionSchema,
  type TransactionValues,
} from "@/features/transactions/schemas/transaction-schemas";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Debes iniciar sesión para gestionar transacciones.");
  }

  return { supabase, userId: user.id };
}

function revalidateTransactions() {
  revalidatePath("/transactions");
  revalidatePath("/");
  revalidatePath("/reports");
  revalidatePath("/budgets");
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

type AccountEffect = {
  accountId: string | null;
  type: TransactionType;
  amount: number;
};

// Expense lowers the balance and income raises it; direction -1 undoes a past effect.
async function applyAccountEffect(
  supabase: Supabase,
  { accountId, type, amount }: AccountEffect,
  direction: 1 | -1,
) {
  if (!accountId) return;

  const raises = (type === "income") === (direction === 1);
  const { error } = await supabase.rpc(
    raises ? "increment_account_balance" : "decrement_account_balance",
    { p_account_id: accountId, p_amount: amount },
  );
  if (error) throw new Error(error.message);
}

// What a stored transaction did to its account, so it can be undone.
async function getAccountEffect(
  supabase: Supabase,
  transactionId: string,
): Promise<AccountEffect> {
  const { data, error } = await supabase
    .from("transactions")
    .select("account_id, type, amount, account_amount")
    .eq("id", transactionId)
    .single();
  if (error || !data) throw new Error("No se encontró la transacción.");

  return {
    accountId: data.account_id,
    type: data.type as TransactionType,
    amount: data.account_amount ?? data.amount,
  };
}

// Amount that moves the account, in the account's currency.
async function resolveAccountAmount(
  supabase: Supabase,
  values: TransactionValues,
): Promise<number | null> {
  if (!values.accountId) return null;

  const { data: account, error } = await supabase
    .from("accounts")
    .select("currency")
    .eq("id", values.accountId)
    .single();
  if (error || !account) throw new Error("La cuenta seleccionada no existe.");

  if (account.currency === values.currency) return null;
  if (!values.accountAmount) {
    throw new Error(
      `Ingresa el monto en ${account.currency} que se movió en la cuenta.`,
    );
  }
  return values.accountAmount;
}

export async function createTransaction(rawValues: TransactionValues) {
  const values = parseOrThrow(transactionSchema, rawValues);
  const { supabase, userId } = await requireUser();

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .upsert(
      { user_id: userId, name: values.categoryName, type: values.type },
      { onConflict: "user_id,type,name" },
    )
    .select("id")
    .single();

  if (categoryError) throw new Error(categoryError.message);

  const accountAmount = await resolveAccountAmount(supabase, values);

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    category_id: category.id,
    type: values.type,
    amount: values.amount,
    currency: values.currency,
    description: values.description,
    occurred_on: values.occurredOn,
    notes: values.notes || null,
    account_id: values.accountId || null,
    account_amount: accountAmount,
  });

  if (error) throw new Error(error.message);

  await applyAccountEffect(
    supabase,
    {
      accountId: values.accountId || null,
      type: values.type,
      amount: accountAmount ?? values.amount,
    },
    1,
  );
  revalidateTransactions();
}

export async function updateTransaction(
  rawId: string,
  rawValues: TransactionValues,
) {
  const id = parseOrThrow(transactionIdSchema, rawId);
  const values = parseOrThrow(transactionSchema, rawValues);
  const { supabase, userId } = await requireUser();

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .upsert(
      { user_id: userId, name: values.categoryName, type: values.type },
      { onConflict: "user_id,type,name" },
    )
    .select("id")
    .single();

  if (categoryError) throw new Error(categoryError.message);

  const [accountAmount, previous] = await Promise.all([
    resolveAccountAmount(supabase, values),
    getAccountEffect(supabase, id),
  ]);

  const updateData: TablesUpdate<"transactions"> = {
    category_id: category.id,
    type: values.type,
    amount: values.amount,
    currency: values.currency,
    description: values.description,
    occurred_on: values.occurredOn,
    notes: values.notes || null,
    account_id: values.accountId || null,
    account_amount: accountAmount,
  };

  const { error } = await supabase
    .from("transactions")
    .update(updateData)
    .eq("id", id);
  if (error) throw new Error(error.message);

  await applyAccountEffect(supabase, previous, -1);
  // A transaction that had no account was never counted in a balance, so linking one only labels it.
  if (previous.accountId) {
    await applyAccountEffect(
      supabase,
      {
        accountId: values.accountId || null,
        type: values.type,
        amount: accountAmount ?? values.amount,
      },
      1,
    );
  }
  revalidateTransactions();
}

export async function deleteTransaction(rawId: string) {
  const id = parseOrThrow(transactionIdSchema, rawId);
  const { supabase } = await requireUser();
  const previous = await getAccountEffect(supabase, id);

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await applyAccountEffect(supabase, previous, -1);
  revalidateTransactions();
}
