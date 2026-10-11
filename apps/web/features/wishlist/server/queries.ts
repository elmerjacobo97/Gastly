import "server-only";

import { createClient } from "@/lib/supabase/server";
import { type CurrencyCode } from "@/lib/format";
import {
  type WishlistItem,
  type WishlistPriority,
  type WishlistStatus,
} from "@/features/wishlist/types/wishlist-types";

type WishlistItemRow = {
  id: string;
  name: string;
  estimated_price: number | string;
  currency: CurrencyCode;
  url: string | null;
  notes: string | null;
  priority: WishlistPriority;
  status: WishlistStatus;
  created_at: string;
};

function mapItem(row: WishlistItemRow): WishlistItem {
  return {
    id: row.id,
    name: row.name,
    estimatedPrice: Number(row.estimated_price),
    currency: row.currency,
    url: row.url,
    notes: row.notes,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getWishlistItems(): Promise<WishlistItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select(
      "id, name, estimated_price, currency, url, notes, priority, status, created_at",
    )
    .order("created_at", { ascending: false })
    .overrideTypes<WishlistItemRow[], { merge: false }>();
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapItem);
}
