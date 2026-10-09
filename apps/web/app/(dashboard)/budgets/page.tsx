import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BudgetsPanel } from "@/features/budgets/components/budgets-panel";
import { getBudgetOverview } from "@/features/budgets/server/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Presupuestos",
};

function parseMonth(value?: string) {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return new Date();
  return new Date(`${value}-01T12:00:00`);
}

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { month: monthParam } = await searchParams;
  const overview = await getBudgetOverview(parseMonth(monthParam));

  return <BudgetsPanel overview={overview} />;
}
