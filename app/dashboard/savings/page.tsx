import { redirect } from "next/navigation"

import { SavingsPanel } from "@/features/savings/components/savings-panel"
import { getSavingsGoals } from "@/features/savings/server/queries"
import { createClient } from "@/lib/supabase/server"

export default async function SavingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const goals = await getSavingsGoals()

  return <SavingsPanel goals={goals} />
}
