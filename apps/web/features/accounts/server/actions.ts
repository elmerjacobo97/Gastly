"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { parseOrThrow } from "@/lib/validation";
import {
  accountIdSchema,
  accountSchema,
  accountUpdateSchema,
  type AccountUpdateValues,
  type AccountValues,
} from "@/features/accounts/schemas/account-schemas";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Debes iniciar sesión.");

  return { supabase, userId: user.id };
}

function revalidateAccounts() {
  revalidatePath("/settings");
  revalidatePath("/recurring-payments");
  revalidatePath("/installments");
  revalidatePath("/");
}

export async function createAccount(rawValues: AccountValues): Promise<string> {
  const values = parseOrThrow(accountSchema, rawValues);
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: values.name,
      currency: values.currency,
      balance: values.balance,
      color: values.color,
      notes: values.notes || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidateAccounts();
  return data.id;
}

export async function updateAccount(
  rawId: string,
  rawValues: AccountUpdateValues,
) {
  const id = parseOrThrow(accountIdSchema, rawId);
  const values = parseOrThrow(accountUpdateSchema, rawValues);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("accounts")
    .update({
      name: values.name,
      balance: values.balance,
      color: values.color,
      notes: values.notes || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAccounts();
}

export async function deleteAccount(rawId: string) {
  const id = parseOrThrow(accountIdSchema, rawId);
  const { supabase } = await requireUser();

  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAccounts();
}
