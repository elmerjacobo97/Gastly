import { redirect } from "next/navigation"

import { LoansPanel } from "@/features/loans/components/loans-panel"
import { createClient } from "@/lib/supabase/server"

export default async function LoansPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <LoansPanel />
}
