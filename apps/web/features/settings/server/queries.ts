import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getTelegramConnection() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("telegram_connections")
    .select("telegram_user_id, telegram_username, created_at")
    .single();
  return data ?? null;
}
