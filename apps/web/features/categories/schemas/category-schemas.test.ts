import { describe, expect, it } from "vitest";

import {
  categoryIdSchema,
  categorySchema,
  categoryUpdateSchema,
} from "@/features/categories/schemas/category-schemas";

const validCategory = {
  name: "Comida",
  type: "expense",
  color: "#f97316",
  icon: "utensils",
};

describe("categorySchema", () => {
  it("parses a valid category", () => {
    expect(categorySchema.parse(validCategory)).toEqual(validCategory);
  });

  it("trims the name and accepts income type", () => {
    const parsed = categorySchema.parse({
      ...validCategory,
      name: "  Sueldo  ",
      type: "income",
    });

    expect(parsed.name).toBe("Sueldo");
    expect(parsed.type).toBe("income");
  });

  it("rejects an empty name", () => {
    const result = categorySchema.safeParse({
      ...validCategory,
      name: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa un nombre de categoria.",
      );
    }
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = categorySchema.safeParse({ ...validCategory, name: "A" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa un nombre de categoria.",
      );
    }
  });

  it("rejects an unknown type", () => {
    const result = categorySchema.safeParse({
      ...validCategory,
      type: "transfer",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty color", () => {
    const result = categorySchema.safeParse({ ...validCategory, color: "  " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Selecciona un color.");
    }
  });

  it("rejects an empty icon", () => {
    const result = categorySchema.safeParse({ ...validCategory, icon: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Selecciona un icono.");
    }
  });
});

describe("categoryUpdateSchema", () => {
  it("accepts name, color and icon without a type", () => {
    expect(
      categoryUpdateSchema.parse({ name: "Ocio", color: "#10b981", icon: "x" }),
    ).toEqual({ name: "Ocio", color: "#10b981", icon: "x" });
  });

  it("rejects a missing icon", () => {
    const result = categoryUpdateSchema.safeParse({
      name: "Ocio",
      color: "#10b981",
    });

    expect(result.success).toBe(false);
  });
});

describe("categoryIdSchema", () => {
  it("accepts a valid uuid", () => {
    expect(categoryIdSchema.parse("3f2504e0-4f89-41d3-9a0c-0305e82c3301")).toBe(
      "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    );
  });

  it("rejects a non uuid string", () => {
    const result = categoryIdSchema.safeParse("cat-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona una categoría válida.",
      );
    }
  });

  it("rejects an empty string", () => {
    expect(categoryIdSchema.safeParse("").success).toBe(false);
  });
});
