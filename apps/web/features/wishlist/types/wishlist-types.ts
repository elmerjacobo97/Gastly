import { type CurrencyCode } from "@/lib/format";

export const WISHLIST_PRIORITIES = ["low", "medium", "high"] as const;

export const WISHLIST_STATUSES = ["pending", "purchased"] as const;

export type WishlistPriority = (typeof WISHLIST_PRIORITIES)[number];

export type WishlistStatus = (typeof WISHLIST_STATUSES)[number];

export type WishlistItem = {
  id: string;
  name: string;
  estimatedPrice: number;
  currency: CurrencyCode;
  url: string | null;
  notes: string | null;
  priority: WishlistPriority;
  status: WishlistStatus;
  createdAt: string;
};
