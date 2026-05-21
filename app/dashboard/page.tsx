import { createClient } from "@/lib/supabase/server"
import { TransactionsPanel } from "@/features/transactions/components/transactions-panel"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <TransactionsPanel
      userEmail={user?.email}
      userName={user?.user_metadata?.full_name as string | undefined}
    />
  )
}
