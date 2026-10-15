import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoansPanel } from "@/features/loans/components/loans-panel";
import { getLoans } from "@/features/loans/server/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Préstamos",
};

export default async function LoansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const loans = await getLoans();

  const fullName = user.user_metadata?.full_name as string | undefined;
  const ownerName =
    fullName?.split(" ")[0] || user.email?.split("@")[0] || "Yo";

  return <LoansPanel loans={loans} ownerName={ownerName} />;
}
