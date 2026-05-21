import { redirect } from "next/navigation";

import { BudgetPanel } from "@/features/budget/components/budget-panel";
import { createClient } from "@/lib/supabase/server";

export default async function BudgetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <BudgetPanel />;
}
