import { describe, expect, it } from "vitest";

import { matchesQuery } from "@/lib/search";

describe("matchesQuery", () => {
  it("matches everything when query is empty", () => {
    expect(matchesQuery("", "Café")).toBe(true);
    expect(matchesQuery("   ", null)).toBe(true);
  });

  it("ignores case and accents", () => {
    expect(matchesQuery("cafe", "Café")).toBe(true);
    expect(matchesQuery("CAFÉ", "cafe")).toBe(true);
  });

  it("checks every field and skips nullish ones", () => {
    expect(matchesQuery("luz", null, "Pago de luz")).toBe(true);
    expect(matchesQuery("luz", undefined, "Agua")).toBe(false);
  });
});
