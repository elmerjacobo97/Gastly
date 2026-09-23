"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { parseOrThrow } from "@/lib/validation";
import {
  accountSchema,
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
