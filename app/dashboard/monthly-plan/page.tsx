import { redirect } from "next/navigation"

import { MonthlyPlanPanel } from "@/features/monthly-plan/components/monthly-plan-panel"
import { createClient } from "@/lib/supabase/server"

export default async function MonthlyPlanPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <MonthlyPlanPanel />
}
