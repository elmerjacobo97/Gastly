"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { parseOrThrow } from "@/lib/validation";
import {
  categoryIdSchema,
  categorySchema,
  categoryUpdateSchema,
  type CategoryValues,
} from "@/features/categories/schemas/category-schemas";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Debes iniciar sesion para crear categorias.");
  }

  return { supabase, userId: user.id };
}

function revalidateCategories() {
  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function createCategory(
  rawValues: CategoryValues,
): Promise<string> {
  const values = parseOrThrow(categorySchema, rawValues);
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: values.name,
      type: values.type,
      color: values.color,
      icon: values.icon,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe una categoria con ese nombre y tipo.");
    }

    throw new Error(error.message);
  }

  revalidateCategories();
  return data.id;
}

export async function updateCategory(
  rawId: string,
  rawValues: Pick<CategoryValues, "name" | "color" | "icon">,
) {
  const id = parseOrThrow(categoryIdSchema, rawId);
  const values = parseOrThrow(categoryUpdateSchema, rawValues);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("categories")
    .update({ name: values.name, color: values.color, icon: values.icon })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe una categoría con ese nombre.");
    }
    throw new Error(error.message);
  }

  revalidateCategories();
}

export async function deleteCategory(rawCategoryId: string) {
  const categoryId = parseOrThrow(categoryIdSchema, rawCategoryId);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateCategories();
}
