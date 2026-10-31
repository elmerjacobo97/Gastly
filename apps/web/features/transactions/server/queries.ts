import "server-only";

import { format, startOfMonth, endOfMonth } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { type Category } from "@/lib/category-types";
import {
  type Transaction,
  type TransactionType,
} from "@/lib/transaction-types";

const TRANSACTION_SELECT =
  "id, type, amount, currency, description, occurred_on, notes, recurring_expense_id, account_id, account_amount, categories(id, name, type, color, icon, description)";

type TransactionRow = {
  id: string;
  type: TransactionType;
  amount: number | string;
  currency: Transaction["currency"];
  description: string;
  occurred_on: string;
  notes: string | null;
  recurring_expense_id: string | null;
  account_id: string | null;
  account_amount: number | string | null;
  categories: CategoryRow | null;
};

type CategoryRow = {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  description: string | null;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    color: row.color,
    icon: row.icon,
    description: row.description ?? "",
  };
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    currency: row.currency,
    description: row.description,
    occurredOn: row.occurred_on,
    notes: row.notes,
    recurringExpenseId: row.recurring_expense_id,
    accountId: row.account_id,
    accountAmount:
      row.account_amount === null ? null : Number(row.account_amount),
    category: row.categories ? mapCategory(row.categories) : null,
  };
}

export async function getTransactions(opts?: {
  type?: TransactionType;
  month?: Date;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 500);

  if (opts?.type) query = query.eq("type", opts.type);

  if (opts?.month) {
    query = query
      .gte("occurred_on", format(startOfMonth(opts.month), "yyyy-MM-dd"))
      .lte("occurred_on", format(endOfMonth(opts.month), "yyyy-MM-dd"));
  }

  if (opts?.from) query = query.gte("occurred_on", opts.from);
  if (opts?.to) query = query.lte("occurred_on", opts.to);

  const { data, error } = await query.overrideTypes<
    TransactionRow[],
    { merge: false }
  >();
  if (error) throw new Error(error.message);
  return data.map(mapTransaction);
}
