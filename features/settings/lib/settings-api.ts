import { createClient } from "@/lib/supabase/browser"

export async function getTelegramConnection() {
  const supabase = createClient()
  const { data } = await supabase
    .from("telegram_connections")
    .select("telegram_user_id, telegram_username, created_at")
    .single()
  return data ?? null
}
