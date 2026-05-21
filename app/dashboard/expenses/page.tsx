import { redirect } from "next/navigation"

import { ExpensesPanel } from "@/features/expenses/components/expenses-panel"
import { createClient } from "@/lib/supabase/server"

export default async function ExpensesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <ExpensesPanel />
}
