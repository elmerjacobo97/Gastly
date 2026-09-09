import { describe, it, expect } from "vitest"
import { parseConfig } from "../config.js"
import { parseSession } from "../session.js"

describe("parseConfig", () => {
  it("parses valid config", () => {
    const result = parseConfig({
      url: "https://abc.supabase.co",
      publishableKey: "ey...",
    })
    expect(result.url).toBe("https://abc.supabase.co")
    expect(result.publishableKey).toBe("ey...")
  })

  it("trims trailing slashes from url", () => {
    const result = parseConfig({
      url: "https://abc.supabase.co/",
      publishableKey: "ey...",
    })
    expect(result.url).toBe("https://abc.supabase.co")
  })

  it("throws on missing url", () => {
    expect(() => parseConfig({ publishableKey: "ey..." })).toThrow(
      /url and publishableKey are required/,
    )
  })

  it("throws on empty publishableKey", () => {
    expect(() => parseConfig({ url: "https://abc.supabase.co", publishableKey: "" })).toThrow(
      /url and publishableKey are required/,
    )
  })

  it("throws on non-object", () => {
    expect(() => parseConfig(null)).toThrow(/expected an object/)
  })
})

describe("parseSession", () => {
  it("parses valid session", () => {
    const result = parseSession({
      userId: "user-123",
      accessToken: "at-xxx",
      refreshToken: "rt-yyy",
    })
    expect(result.userId).toBe("user-123")
    expect(result.accessToken).toBe("at-xxx")
    expect(result.refreshToken).toBe("rt-yyy")
  })

  it("throws on missing fields", () => {
    expect(() =>
      parseSession({ userId: "u", accessToken: "a" }),
    ).toThrow(/userId, accessToken, and refreshToken are required/)
  })
})
