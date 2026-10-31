import { describe, expect, it } from "vitest";

import { isPrivatePath, resolveSafePath } from "@/lib/private-routes";

describe("isPrivatePath", () => {
  it.each(["/", "/transactions", "/settings/accounts", "/loans/123"])(
    "accepts %s",
    (path) => {
      expect(isPrivatePath(path)).toBe(true);
    },
  );

  it.each(["/login", "/api/health", "/transactionsx", "", "settings"])(
    "rejects %s",
    (path) => {
      expect(isPrivatePath(path)).toBe(false);
    },
  );

  it.each(["//evil.com", "//evil.com/transactions", "/\\evil.com", "///x"])(
    "rejects the cross-origin form %s",
    (path) => {
      expect(isPrivatePath(path)).toBe(false);
    },
  );
});

describe("resolveSafePath", () => {
  it("keeps a private path", () => {
    expect(resolveSafePath("/transactions")).toBe("/transactions");
  });

  it.each([undefined, "", "/login", "//evil.com", "https://evil.com"])(
    "falls back to home for %s",
    (next) => {
      expect(resolveSafePath(next)).toBe("/");
    },
  );
});
