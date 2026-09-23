import "server-only";

import { createClient } from "@/lib/supabase/server";
import { type Account } from "@/lib/account-types";

type AccountRow = {
  id: string;
  name: string;
  balance: string | number;
  color: string;
  notes: string | null;
  created_at: string;
};

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    balance: Number(row.balance),
    color: row.color,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, balance, color, notes, created_at")
    .order("created_at", { ascending: true })
    .overrideTypes<AccountRow[], { merge: false }>();
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAccount);
}
