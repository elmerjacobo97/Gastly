import { describe, expect, it } from "vitest";

import { pickCategory } from "@/features/transactions/lib/category-suggestion";

const names = ["Comida", "Transporte"];

describe("pickCategory", () => {
  it("returns the stored name, matching case-insensitively", () => {
    expect(pickCategory({ category: " comida " }, names)).toBe("Comida");
  });

  it("rejects names the user does not have", () => {
    expect(pickCategory({ category: "Viajes" }, names)).toBeNull();
  });

  it("rejects malformed model output", () => {
    for (const raw of [
      null,
      "Comida",
      {},
      { category: null },
      { category: 1 },
    ]) {
      expect(pickCategory(raw, names)).toBeNull();
    }
  });
});
