import "server-only";

import { format, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";

import { createClient } from "@/lib/supabase/server";
import { CHART_COLORS } from "@/lib/chart-utils";
import { CURRENCY_CODES, type CurrencyCode } from "@/lib/format";

const PAGE_SIZE = 1000;

type MonthlyTransactionRow = {
  type: string;
  amount: number | string;
  occurred_on: string;
  currency: CurrencyCode;
};

type CategoryExpenseRow = {
  amount: number | string;
  currency: CurrencyCode;
  category_id: string | null;
  categories:
    | { name: string; color: string; icon: string }
    | { name: string; color: string; icon: string }[]
    | null;
};

export type MonthlyTotal = {
  month: string;
  monthDate: string;
  currency: CurrencyCode;
  income: number;
  expenses: number;
};

export type CategoryTotal = {
  name: string;
  currency: CurrencyCode;
  value: number;
  color: string;
  fill: string;
  icon: string;
  categoryColor: string;
};

export async function getMonthlyTotals(months = 6): Promise<MonthlyTotal[]> {
  const supabase = await createClient();
  const since = format(
    startOfMonth(subMonths(new Date(), months - 1)),
    "yyyy-MM-dd",
  );

  const data: MonthlyTransactionRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data: page, error } = await supabase
      .from("transactions")
      .select("type, amount, occurred_on, currency, id")
      .gte("occurred_on", since)
      .order("occurred_on", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)
      .overrideTypes<MonthlyTransactionRow[], { merge: false }>();
    if (error) throw new Error(error.message);
    data.push(...(page ?? []));
    if (!page || page.length < PAGE_SIZE) break;
  }

  const currencies = CURRENCY_CODES.filter((currency) =>
    data.some((transaction) => transaction.currency === currency),
  );
  if (currencies.length === 0) currencies.push("PEN");

  const totals = new Map<
    string,
    {
      monthDate: string;
      currency: CurrencyCode;
      income: number;
      expenses: number;
    }
  >();

  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const monthDate = format(startOfMonth(d), "yyyy-MM");
    for (const currency of currencies) {
      totals.set(`${monthDate}:${currency}`, {
        monthDate,
        currency,
        income: 0,
        expenses: 0,
      });
    }
  }

  for (const tx of data ?? []) {
    const key = `${tx.occurred_on.slice(0, 7)}:${tx.currency}`;
    const entry = totals.get(key);
    if (!entry) continue;
    if (tx.type === "income") entry.income += Number(tx.amount);
    else entry.expenses += Number(tx.amount);
  }

  return Array.from(totals.values()).map((entry) => ({
    ...entry,
    month: format(new Date(`${entry.monthDate}-01`), "MMM", { locale: es }),
  }));
}

export async function getCategoryTotals(
  month?: Date,
): Promise<CategoryTotal[]> {
  const supabase = await createClient();
  const target = month ?? new Date();
  const start = format(startOfMonth(target), "yyyy-MM-dd");
  const end = format(
    new Date(target.getFullYear(), target.getMonth() + 1, 0),
    "yyyy-MM-dd",
  );

  const data: CategoryExpenseRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data: page, error } = await supabase
      .from("transactions")
      .select(
        "amount, currency, category_id, categories(name, color, icon), id",
      )
      .eq("type", "expense")
      .gte("occurred_on", start)
      .lte("occurred_on", end)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)
      .overrideTypes<CategoryExpenseRow[], { merge: false }>();
    if (error) throw new Error(error.message);
    data.push(...(page ?? []));
    if (!page || page.length < PAGE_SIZE) break;
  }

  const totals = new Map<
    string,
    {
      currency: CurrencyCode;
      name: string;
      value: number;
      color: string;
      icon: string;
    }
  >();

  for (const tx of data ?? []) {
    const rawCat = tx.categories;
    const cat = Array.isArray(rawCat) ? rawCat[0] : rawCat;
    const name = cat?.name ?? "Sin categoría";
    const color = cat?.color ?? "gray";
    const key = `${tx.currency}:${tx.category_id ?? "uncategorized"}`;
    const entry = totals.get(key) ?? {
      currency: tx.currency,
      name,
      value: 0,
      color,
      icon: cat?.icon ?? "tag",
    };
    entry.value += Number(tx.amount);
    totals.set(key, entry);
  }

  return CURRENCY_CODES.flatMap((currency) =>
    Array.from(totals.values())
      .filter((entry) => entry.currency === currency)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(({ name, value, color, icon }, i) => ({
        name,
        currency,
        value,
        color: CHART_COLORS[i % CHART_COLORS.length],
        fill: CHART_COLORS[i % CHART_COLORS.length],
        icon,
        categoryColor: color,
      })),
  );
}
