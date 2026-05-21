import { redirect } from "next/navigation"

import { FixedExpensesPanel } from "@/features/fixed-expenses/components/fixed-expenses-panel"
import { createClient } from "@/lib/supabase/server"

export default async function FixedExpensesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <FixedExpensesPanel />
}
