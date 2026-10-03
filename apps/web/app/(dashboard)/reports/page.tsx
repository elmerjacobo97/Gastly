import { endOfYear, format, startOfYear, subYears } from "date-fns";
import { redirect } from "next/navigation";

import { ReportsPanel } from "@/features/reports/components/reports-panel";
import { getTransactions } from "@/features/transactions/server/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Reportes",
};

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date();
  const transactions = await getTransactions({
    from: format(startOfYear(subYears(today, 1)), "yyyy-MM-dd"),
    to: format(endOfYear(today), "yyyy-MM-dd"),
  });

  return <ReportsPanel transactions={transactions} />;
}
