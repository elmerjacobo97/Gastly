import { redirect } from "next/navigation"

import { TransactionsPanel } from "@/features/transactions/components/transactions-panel"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <TransactionsPanel
      userEmail={user.email}
      userName={user.user_metadata?.full_name as string | undefined}
    />
  )
}
