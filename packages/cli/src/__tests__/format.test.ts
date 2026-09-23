import { describe, it, expect } from "vitest"
import { formatCurrency, formatDate, formatPercent } from "../format.js"

describe("formatCurrency", () => {
  it("formats PEN by default", () => {
    const result = formatCurrency(100)
    expect(result).toContain("100")
    expect(result).toMatch(/S\/|PEN/)
  })

  it("formats USD", () => {
    const result = formatCurrency(50.5, "USD")
    expect(result).toContain("50.50")
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toContain("0")
  })

  it("formats negative", () => {
    const result = formatCurrency(-25)
    expect(result).toContain("25")
  })
})

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2026-09-08")
    expect(result).toBeTruthy()
    expect(typeof result).toBe("string")
  })
})

describe("formatPercent", () => {
  it("formats with one decimal", () => {
    expect(formatPercent(75.5)).toBe("75.5%")
  })

  it("formats 100", () => {
    expect(formatPercent(100)).toBe("100.0%")
  })
})
