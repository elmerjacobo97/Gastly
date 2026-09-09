"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { type CategoryValues } from "@/features/categories/schemas/category-schemas"
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

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Debes iniciar sesion para crear categorias.")
  }

  return { supabase, userId: user.id }
}

function revalidateCategories() {
  revalidatePath("/dashboard/categories")
  revalidatePath("/dashboard/transactions")
  revalidatePath("/dashboard")
}

export async function createCategory(values: CategoryValues): Promise<string> {
  const { supabase, userId } = await requireUser()

  const { data, error } = await supabase.from("categories").insert({
    user_id: userId,
    name: values.name,
    type: values.type,
    color: values.color,
    icon: values.icon,
  }).select("id").single()

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe una categoria con ese nombre y tipo.")
    }

    throw new Error(error.message)
  }

  revalidateCategories()
  return data.id
}

export async function updateCategory(
  id: string,
  values: Pick<CategoryValues, "name" | "color" | "icon">
) {
  const { supabase } = await requireUser()

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

  revalidateCategories()
}

export async function deleteCategory(categoryId: string) {
  const { supabase } = await requireUser()

  const { error } = await supabase.from("categories").delete().eq("id", categoryId)

  if (error) {
    throw new Error(error.message)
  }

  revalidateCategories()
}

export async function createSuggestedCategories() {
  const { supabase, userId } = await requireUser()

  const { error } = await supabase.from("categories").upsert(
    suggestedCategories.map((category) => ({
      user_id: userId,
      ...category,
    })),
    { onConflict: "user_id,type,name", ignoreDuplicates: true }
  )

  if (error) {
    throw new Error(error.message)
  }

  revalidateCategories()
}
