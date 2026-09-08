import { createClient } from "@/lib/supabase/browser"

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
  const supabase = createClient()
  const { data, error } = await supabase
    .from("user_settings")
    .select("savings_percentage")
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapSettings(data as UserSettingsRow) : DEFAULT_SETTINGS
}

export async function upsertUserSettings(values: Partial<UserSettings>): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      ...(values.savingsPercentage !== undefined && {
        savings_percentage: values.savingsPercentage,
      }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
  if (error) throw new Error(error.message)
}
