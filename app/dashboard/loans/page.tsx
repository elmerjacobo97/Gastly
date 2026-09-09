import { redirect } from "next/navigation"

import { LoansPanel } from "@/features/loans/components/loans-panel"
import { getLoans } from "@/features/loans/server/queries"
import { createClient } from "@/lib/supabase/server"

export default async function LoansPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const loans = await getLoans()

  return <LoansPanel loans={loans} />
}
