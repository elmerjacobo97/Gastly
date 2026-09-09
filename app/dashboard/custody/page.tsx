import { redirect } from "next/navigation"

import { CustodyPanel } from "@/features/custody/components/custody-panel"
import { getCustodyOrders } from "@/features/custody/server/queries"
import { createClient } from "@/lib/supabase/server"

export default async function CustodyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const orders = await getCustodyOrders()

  return <CustodyPanel orders={orders} />
}
