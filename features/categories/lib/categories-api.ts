import { createClient } from "@/lib/supabase/browser"
import { type CategoryValues } from "@/features/categories/schemas/category-schemas"
import { type Category } from "@/features/categories/types/category-types"
import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"

const suggestedCategories = [
  { name: "Sueldo", type: "income", color: "emerald", icon: "salary" },
  { name: "Ahorro", type: "income", color: "green", icon: "savings" },
  { name: "Comida", type: "expense", color: "orange", icon: "food" },
  { name: "Servicios", type: "expense", color: "blue", icon: "services" },
  { name: "Software", type: "expense", color: "violet", icon: "software" },
  { name: "Cuidado personal", type: "expense", color: "pink", icon: "personal-care" },
  { name: "Transporte", type: "expense", color: "amber", icon: "transport" },
  { name: "Salidas", type: "expense", color: "rose", icon: "entertainment" },
  { name: "Compras", type: "expense", color: "purple", icon: "shopping" },
] satisfies Array<{
  name: string
  type: TransactionType
  color: string
  icon: string
}>

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

export async function getCategories() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, type, color, icon, created_at")
    .order("type", { ascending: true })
    .order("name", { ascending: true })
    .returns<CategoryRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return data.map(mapCategory)
}

export async function createCategory(values: CategoryValues) {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Debes iniciar sesion para crear categorias.")
  }

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: values.name,
    type: values.type,
    color: values.color,
    icon: values.icon,
  })

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe una categoria con ese nombre y tipo.")
    }

    throw new Error(error.message)
  }
}

export async function updateCategory(
  id: string,
  values: Pick<CategoryValues, "name" | "color" | "icon">
) {
  const supabase = createClient()
  const { error } = await supabase
    .from("categories")
    .update({ name: values.name, color: values.color, icon: values.icon })
    .eq("id", id)

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe una categoría con ese nombre.")
    }
    throw new Error(error.message)
  }
}

export async function deleteCategory(categoryId: string) {
  const supabase = createClient()
  const { error } = await supabase.from("categories").delete().eq("id", categoryId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function createSuggestedCategories() {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Debes iniciar sesion para crear categorias.")
  }

  const { error } = await supabase.from("categories").upsert(
    suggestedCategories.map((category) => ({
      user_id: user.id,
      ...category,
    })),
    { onConflict: "user_id,type,name", ignoreDuplicates: true }
  )

  if (error) {
    throw new Error(error.message)
  }
}
