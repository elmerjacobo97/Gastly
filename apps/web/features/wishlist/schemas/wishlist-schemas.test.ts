import { describe, expect, it } from "vitest";

import {
  wishlistItemIdSchema,
  wishlistItemSchema,
  wishlistStatusSchema,
} from "@/features/wishlist/schemas/wishlist-schemas";

const validItem = {
  name: "Edredón 1.5 plazas",
  estimatedPrice: "120",
  currency: "PEN",
  url: "",
  priority: "medium",
  notes: "",
};

describe("wishlistItemSchema", () => {
  it("parses a valid item and coerces the price", () => {
    const parsed = wishlistItemSchema.parse(validItem);

    expect(parsed.estimatedPrice).toBe(120);
  });

  it("trims the name and notes", () => {
    const parsed = wishlistItemSchema.parse({
      ...validItem,
      name: "  Gorra  ",
      notes: "  negra  ",
    });

    expect(parsed.name).toBe("Gorra");
    expect(parsed.notes).toBe("negra");
  });

  it("accepts an empty url", () => {
    expect(wishlistItemSchema.safeParse(validItem).success).toBe(true);
  });

  it("accepts a valid url", () => {
    expect(
      wishlistItemSchema.safeParse({
        ...validItem,
        url: "https://example.com/reloj",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid url", () => {
    const result = wishlistItemSchema.safeParse({
      ...validItem,
      url: "no es un link",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Ingresa un link válido.");
    }
  });

  it("rejects an empty name", () => {
    const result = wishlistItemSchema.safeParse({ ...validItem, name: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa el nombre del producto.",
      );
    }
  });

  it("rejects a zero price", () => {
    const result = wishlistItemSchema.safeParse({
      ...validItem,
      estimatedPrice: "0",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El precio debe ser mayor a 0.",
      );
    }
  });

  it("rejects an unknown currency", () => {
    expect(
      wishlistItemSchema.safeParse({ ...validItem, currency: "EUR" }).success,
    ).toBe(false);
  });
});

describe("wishlistItemIdSchema", () => {
  it("rejects a non uuid string", () => {
    const result = wishlistItemIdSchema.safeParse("item-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona un producto válido.",
      );
    }
  });
});

describe("wishlistStatusSchema", () => {
  it("accepts pending and purchased only", () => {
    expect(wishlistStatusSchema.safeParse("purchased").success).toBe(true);
    expect(wishlistStatusSchema.safeParse("pending").success).toBe(true);
    expect(wishlistStatusSchema.safeParse("cancelled").success).toBe(false);
  });
});
