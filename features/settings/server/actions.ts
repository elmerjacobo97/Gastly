"use server"

import { createClient } from "@/lib/supabase/server"

type ActionResult = { error: string } | { token: string } | undefined

export async function generateTelegramLinkToken(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Sesión expirada." }

  // Expire previous unused tokens for this user
  await supabase
    .from("telegram_link_tokens")
    .delete()
    .eq("user_id", user.id)
    .is("used_at", null)

  const { data, error } = await supabase
    .from("telegram_link_tokens")
    .insert({ user_id: user.id })
    .select("token")
    .single()

  if (error) return { error: error.message }

  return { token: data.token }
}

export async function disconnectTelegram(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Sesión expirada." }

  const { error } = await supabase
    .from("telegram_connections")
    .delete()
    .eq("user_id", user.id)

  if (error) return { error: error.message }
}
