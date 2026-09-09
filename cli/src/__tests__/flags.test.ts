import { describe, it, expect } from "vitest"
import { getFlagValue, hasFlag, todayString } from "../flags.js"

describe("getFlagValue", () => {
  it("returns the value after a flag", () => {
    expect(getFlagValue(["--amount", "100"], "--amount")).toBe("100")
  })

  it("returns undefined when flag is absent", () => {
    expect(getFlagValue(["--type", "expense"], "--amount")).toBeUndefined()
  })

  it("returns undefined when flag is last", () => {
    expect(getFlagValue(["--amount"], "--amount")).toBeUndefined()
  })

  it("handles flags with dashes", () => {
    expect(getFlagValue(["-d", "description"], "-d")).toBe("description")
  })
})

describe("hasFlag", () => {
  it("returns true when present", () => {
    expect(hasFlag(["--json", "--help"], "--json")).toBe(true)
  })

  it("returns false when absent", () => {
    expect(hasFlag(["--json"], "--help")).toBe(false)
  })
})

describe("todayString", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = todayString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
