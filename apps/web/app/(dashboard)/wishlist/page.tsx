import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCategories } from "@/features/categories/server/queries";
import { WishlistPanel } from "@/features/wishlist/components/wishlist-panel";
import { getWishlistItems } from "@/features/wishlist/server/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Lista de deseos",
};

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [items, categories] = await Promise.all([
    getWishlistItems(),
    getCategories(),
  ]);

  return <WishlistPanel items={items} categories={categories} />;
}
