import { redirect } from "next/navigation"

import { AccountsPanel } from "@/features/accounts/components/accounts-panel"
import { getAccounts, getAccountTransfers } from "@/features/accounts/server/queries"
import { createClient } from "@/lib/supabase/server"

export default async function AccountsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [accounts, transfers] = await Promise.all([getAccounts(), getAccountTransfers()])

  return <AccountsPanel accounts={accounts} transfers={transfers} />
}
