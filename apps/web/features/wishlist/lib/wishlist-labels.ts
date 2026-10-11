import {
  type WishlistPriority,
  type WishlistStatus,
} from "@/features/wishlist/types/wishlist-types";

export const PRIORITY_LABELS: Record<WishlistPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

export const STATUS_LABELS: Record<WishlistStatus, string> = {
  pending: "Pendiente",
  purchased: "Comprado",
};
