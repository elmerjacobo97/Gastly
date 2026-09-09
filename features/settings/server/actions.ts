"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { type UserSettings } from "@/features/settings/server/queries"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  return { supabase, userId: user.id }
}

function revalidateSettings() {
  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard")
}

export async function upsertUserSettings(values: Partial<UserSettings>): Promise<void> {
  const { supabase, userId } = await requireUser()

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      ...(values.savingsPercentage !== undefined && {
        savings_percentage: values.savingsPercentage,
      }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
  if (error) throw new Error(error.message)

  revalidateSettings()
}

export async function generateTelegramLinkToken(): Promise<{ token: string } | { error: string }> {
  try {
    const { supabase, userId } = await requireUser()
    const { data, error } = await supabase
      .from("telegram_link_tokens")
      .insert({ user_id: userId })
      .select("token")
      .single()

    if (error) throw new Error(error.message)
    return { token: String(data.token) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo generar el código." }
  }
}

export async function disconnectTelegram(): Promise<{ error: string } | null> {
  try {
    const { supabase, userId } = await requireUser()
    const { error } = await supabase
      .from("telegram_connections")
      .delete()
      .eq("user_id", userId)

    if (error) throw new Error(error.message)
    revalidateSettings()
    return null
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo desconectar Telegram." }
  }
}
