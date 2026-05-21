import { redirect } from "next/navigation"

import { InstallmentsPanel } from "@/features/installments/components/installments-panel"
import { createClient } from "@/lib/supabase/server"

export default async function InstallmentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <InstallmentsPanel />
}
