import { beforeEach, describe, expect, it, vi } from "vitest"

const { createAuthedClientMock, writeJsonMock } = vi.hoisted(() => ({
  createAuthedClientMock: vi.fn(),
  writeJsonMock: vi.fn(),
}))

vi.mock("../supabase-client.js", () => ({
  createAuthedClient: createAuthedClientMock,
}))

vi.mock("../format.js", () => ({
  formatCurrency: (amount: number, currency = "PEN") => `${currency} ${amount}`,
  formatDate: (value: string) => value,
  writeJson: writeJsonMock,
  writeLine: vi.fn(),
  writeError: vi.fn(),
}))

import { runTransactions } from "../commands/transactions.js"

type SupabaseResult = { data?: unknown; error: { message: string } | null }

type QueryBuilder = {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  then: (
    onFulfilled?: (value: SupabaseResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>
}

function queryBuilder(result: SupabaseResult): QueryBuilder {
  const builder = {} as QueryBuilder
  const chain = () => builder
  builder.select = vi.fn(chain)
  builder.insert = vi.fn(chain)
  builder.eq = vi.fn(chain)
  builder.ilike = vi.fn(chain)
  builder.single = vi.fn(chain)
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected)
  return builder
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("transactions currency", () => {
  it("stores and returns requested currency for new transactions", async () => {
    const categories = queryBuilder({
      data: [{ id: "food", name: "Food" }],
      error: null,
    })
    const transactions = queryBuilder({
      data: {
        id: "transaction-1",
        type: "expense",
        amount: 50,
        currency: "USD",
        description: "Lunch",
        occurred_on: "2026-10-05",
        notes: null,
        categories: { name: "Food" },
      },
      error: null,
    })
    const supabase = {
      from: vi.fn((table: string) =>
        table === "categories" ? categories : transactions,
      ),
    }
    createAuthedClientMock.mockResolvedValue({
      supabase,
      session: { userId: "user-1" },
    })

    await runTransactions([
      "new",
      "--type",
      "expense",
      "--amount",
      "50",
      "-d",
      "Lunch",
      "--category",
      "Food",
      "--currency",
      "USD",
      "--json",
    ])

    expect(transactions.insert).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "USD" }),
    )
    expect(writeJsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "USD", amount: 50 }),
    )
  })
})
