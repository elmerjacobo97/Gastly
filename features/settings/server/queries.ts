import { createClient } from "@/lib/supabase/server"

export type UserSettings = {
  savingsPercentage: number
}

type UserSettingsRow = {
  savings_percentage: string | number
}

const DEFAULT_SETTINGS: UserSettings = { savingsPercentage: 20 }

function mapSettings(row: UserSettingsRow): UserSettings {
  return { savingsPercentage: Number(row.savings_percentage) }
}

export async function getUserSettings(): Promise<UserSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("user_settings")
    .select("savings_percentage")
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapSettings(data as UserSettingsRow) : DEFAULT_SETTINGS
}

export async function getTelegramConnection() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("telegram_connections")
    .select("telegram_user_id, telegram_username, created_at")
    .single()
  return data ?? null
}
