import { redirect } from "next/navigation"

import { IncomePanel } from "@/features/income/components/income-panel"
import { createClient } from "@/lib/supabase/server"

export default async function IncomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <IncomePanel />
}
