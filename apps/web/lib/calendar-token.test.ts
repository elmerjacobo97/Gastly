import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { decodeCalendarToken, encodeCalendarToken } from "@/lib/calendar-token";

const originalSecret = process.env.CALENDAR_SECRET;

beforeEach(() => {
  process.env.CALENDAR_SECRET = "test-secret";
});

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.CALENDAR_SECRET;
    return;
  }
  process.env.CALENDAR_SECRET = originalSecret;
});

describe("encodeCalendarToken / decodeCalendarToken", () => {
  it("roundtrips a user id", () => {
    const token = encodeCalendarToken("user-123");
    expect(decodeCalendarToken(token)).toBe("user-123");
  });

  it("roundtrips user ids with unicode and url-unsafe characters", () => {
    const userId = "usuario ñ/123?&=";
    expect(decodeCalendarToken(encodeCalendarToken(userId))).toBe(userId);
  });

  it("produces a different token per user id", () => {
    expect(encodeCalendarToken("user-123")).not.toBe(
      encodeCalendarToken("user-124"),
    );
  });

  it("rejects a token with a corrupted signature", () => {
    const token = encodeCalendarToken("user-123");
    const lastChar = token.slice(-1);
    const corrupted = token.slice(0, -1) + (lastChar === "a" ? "b" : "a");
    expect(decodeCalendarToken(corrupted)).toBeNull();
  });

  it("rejects a signature issued for another user id", () => {
    const encoded = encodeCalendarToken("user-123").split(".")[0];
    const otherSignature = encodeCalendarToken("user-456").split(".")[1];
    expect(decodeCalendarToken(`${encoded}.${otherSignature}`)).toBeNull();
  });

  it("rejects a token without a dot", () => {
    expect(decodeCalendarToken("nodot")).toBeNull();
  });

  it("rejects an empty string", () => {
    expect(decodeCalendarToken("")).toBeNull();
  });

  it("rejects an empty payload even with a signature", () => {
    expect(decodeCalendarToken(".0123456789abcdef0123456789abcdef")).toBeNull();
  });

  it("throws when CALENDAR_SECRET is not configured", () => {
    const token = encodeCalendarToken("user-123");
    delete process.env.CALENDAR_SECRET;
    expect(() => encodeCalendarToken("user-123")).toThrow(
      "CALENDAR_SECRET must be configured",
    );
    expect(() => decodeCalendarToken(token)).toThrow(
      "CALENDAR_SECRET must be configured",
    );
  });
});
