import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { SettingsPanel } from "@/features/settings/components/settings-panel"
import { encodeCalendarToken } from "@/lib/calendar-token"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
  const supabase = await createClient()
  const headersList = await headers()
  const host = headersList.get("host") ?? ""
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const calendarToken = encodeCalendarToken(user.id)
  const calendarUrl = host ? `webcal://${host}/api/calendar/${calendarToken}.ics` : ""

  return (
    <SettingsPanel
      userEmail={user.email ?? ""}
      userName={user.user_metadata?.full_name ?? ""}
      calendarUrl={calendarUrl}
    />
  )
}
