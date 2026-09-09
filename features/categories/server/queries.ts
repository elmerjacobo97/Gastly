import { createClient } from "@/lib/supabase/server"
import { type Category } from "@/features/categories/types/category-types"
import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"

type CategoryRow = {
  id: string
  name: string
  type: TransactionType
  color: string
  icon: string
  created_at: string
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at,
  }
}

export async function getCategories(type?: TransactionType) {
  const supabase = await createClient()
  let query = supabase
    .from("categories")
    .select("id, name, type, color, icon, created_at")
    .order("type", { ascending: true })
    .order("name", { ascending: true })

  if (type) query = query.eq("type", type)

  const { data, error } = await query.overrideTypes<CategoryRow[], { merge: false }>()

  if (error) {
    throw new Error(error.message)
  }

  return data.map(mapCategory)
}
