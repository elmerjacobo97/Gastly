import { z } from "zod";

import { CURRENCY_CODES } from "@/lib/format";
import { numberInput } from "@/lib/validation";
import {
  WISHLIST_PRIORITIES,
  WISHLIST_STATUSES,
} from "@/features/wishlist/types/wishlist-types";

export const wishlistItemSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del producto."),
  estimatedPrice: numberInput(
    z
      .number({ error: "Ingresa un precio válido." })
      .positive("El precio debe ser mayor a 0."),
  ),
  currency: z.enum(CURRENCY_CODES),
  url: z.union([z.literal(""), z.url("Ingresa un link válido.")]),
  priority: z.enum(WISHLIST_PRIORITIES),
  notes: z.string().trim(),
});

export type WishlistItemValues = z.infer<typeof wishlistItemSchema>;

export const wishlistItemIdSchema = z
  .string()
  .uuid("Selecciona un producto válido.");

export const wishlistStatusSchema = z.enum(WISHLIST_STATUSES);
