import { beforeEach, describe, expect, it, vi } from "vitest"

const { createAuthedClientMock, writeJsonMock, writeLineMock } = vi.hoisted(() => ({
  createAuthedClientMock: vi.fn(),
  writeJsonMock: vi.fn(),
  writeLineMock: vi.fn(),
}))

vi.mock("../supabase-client.js", () => ({
  createAuthedClient: createAuthedClientMock,
}))

vi.mock("../format.js", () => ({
  formatCurrency: (amount: number, currency = "PEN") => `${currency} ${amount}`,
  formatPercent: (value: number) => `${value}%`,
  writeJson: writeJsonMock,
  writeLine: writeLineMock,
}))

import { runBudget } from "../commands/budget.js"

function queryBuilder(data: unknown) {
  const builder: Record<string, unknown> = {}
  const chain = () => builder
  Object.assign(builder, {
    select: vi.fn(chain),
    eq: vi.fn(chain),
    gte: vi.fn(chain),
    lte: vi.fn(chain),
    order: vi.fn(chain),
    range: vi.fn(chain),
    then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
      Promise.resolve({ data, error: null }).then(resolve, reject),
  })
  return builder
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("runBudget", () => {
  it("groups actual expenses by category and currency", async () => {
    const budgets = queryBuilder([
      {
        id: "budget-pen",
        amount: 100,
        currency: "PEN",
        categories: { id: "food", name: "Comida" },
      },
      {
        id: "budget-usd",
        amount: 50,
        currency: "USD",
        categories: { id: "food", name: "Comida" },
      },
    ])
    const transactions = queryBuilder([
      { category_id: "food", amount: 25, currency: "PEN" },
      { category_id: "food", amount: 12, currency: "USD" },
      { category_id: "food", amount: 9, currency: "PEN" },
    ])
    const supabase = {
      from: vi.fn((table: string) =>
        table === "budgets" ? budgets : transactions,
      ),
    }
    createAuthedClientMock.mockResolvedValue({ supabase })

    await runBudget(["--month", "2026-10", "--json"])

    expect(writeJsonMock).toHaveBeenCalledWith([
      {
        id: "budget-pen",
        categoryName: "Comida",
        amount: 100,
        currency: "PEN",
        spent: 34,
        month: "2026-10",
      },
      {
        id: "budget-usd",
        categoryName: "Comida",
        amount: 50,
        currency: "USD",
        spent: 12,
        month: "2026-10",
      },
    ])
  })
})
