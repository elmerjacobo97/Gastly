"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { parseOrThrow } from "@/lib/validation";
import {
  wishlistItemIdSchema,
  wishlistItemSchema,
  wishlistStatusSchema,
  type WishlistItemValues,
} from "@/features/wishlist/schemas/wishlist-schemas";
import { type WishlistStatus } from "@/features/wishlist/types/wishlist-types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Debes iniciar sesión.");

  return { supabase, userId: user.id };
}

function revalidateWishlist() {
  revalidatePath("/wishlist");
}

export async function createWishlistItem(
  rawValues: WishlistItemValues,
): Promise<void> {
  const values = parseOrThrow(wishlistItemSchema, rawValues);
  const { supabase, userId } = await requireUser();

  const { error } = await supabase.from("wishlist_items").insert({
    user_id: userId,
    name: values.name,
    estimated_price: values.estimatedPrice,
    currency: values.currency,
    url: values.url || null,
    notes: values.notes || null,
    priority: values.priority,
  });
  if (error) throw new Error(error.message);
  revalidateWishlist();
}

export async function updateWishlistItem(
  rawId: string,
  rawValues: WishlistItemValues,
): Promise<void> {
  const id = parseOrThrow(wishlistItemIdSchema, rawId);
  const values = parseOrThrow(wishlistItemSchema, rawValues);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("wishlist_items")
    .update({
      name: values.name,
      estimated_price: values.estimatedPrice,
      currency: values.currency,
      url: values.url || null,
      notes: values.notes || null,
      priority: values.priority,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateWishlist();
}

export async function setWishlistItemStatus(
  rawId: string,
  rawStatus: WishlistStatus,
): Promise<void> {
  const id = parseOrThrow(wishlistItemIdSchema, rawId);
  const status = parseOrThrow(wishlistStatusSchema, rawStatus);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("wishlist_items")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateWishlist();
}

export async function deleteWishlistItem(rawId: string): Promise<void> {
  const id = parseOrThrow(wishlistItemIdSchema, rawId);
  const { supabase } = await requireUser();

  const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateWishlist();
}
