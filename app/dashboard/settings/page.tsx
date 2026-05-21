import { redirect } from "next/navigation"

import { SettingsPanel } from "@/features/settings/components/settings-panel"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <SettingsPanel
      userEmail={user.email ?? ""}
      userName={user.user_metadata?.full_name ?? ""}
    />
  )
}
