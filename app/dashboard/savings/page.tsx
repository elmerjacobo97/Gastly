import { redirect } from "next/navigation"

import { SavingsPanel } from "@/features/savings/components/savings-panel"
import { createClient } from "@/lib/supabase/server"

export default async function SavingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <SavingsPanel />
}
