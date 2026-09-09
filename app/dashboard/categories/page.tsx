import { redirect } from "next/navigation"

import { CategoriesPanel } from "@/features/categories/components/categories-panel"
import { getCategories } from "@/features/categories/server/queries"
import { createClient } from "@/lib/supabase/server"

export default async function CategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const categories = await getCategories()

  return <CategoriesPanel categories={categories} />
}
