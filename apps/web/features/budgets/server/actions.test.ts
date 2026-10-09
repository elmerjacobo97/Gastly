import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { revalidatePath } from "next/cache";

import {
  saveCategoryBudget,
  saveMonthlyBudgetTotal,
} from "@/features/budgets/server/actions";
import { createClient } from "@/lib/supabase/server";

type Result = { data?: unknown; error: { message: string } | null };

type QueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: (
    onFulfilled?: (value: Result) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

function createQueryBuilder(result: Result): QueryBuilder {
  const builder = {} as QueryBuilder;
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.upsert = vi.fn(chain);
  builder.maybeSingle = vi.fn().mockResolvedValue(result);
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return builder;
}

function useSupabase(tables: Record<string, QueryBuilder>) {
  const mock = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => tables[table]),
  };
  vi.mocked(createClient).mockResolvedValue(
    mock as unknown as Awaited<ReturnType<typeof createClient>>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("budget actions", () => {
  it("saves expense-category budgets by month and currency", async () => {
    const categories = createQueryBuilder({
      data: { id: "category-1" },
      error: null,
    });
    const budgets = createQueryBuilder({ error: null });
    useSupabase({ categories, budgets });

    await saveCategoryBudget({
      categoryId: "123e4567-e89b-12d3-a456-426614174000",
      month: "2026-10",
      currency: "USD",
      amount: 300,
    });

    expect(categories.eq).toHaveBeenCalledWith("type", "expense");
    expect(budgets.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        category_id: "123e4567-e89b-12d3-a456-426614174000",
        month: "2026-10-01",
        currency: "USD",
        amount: 300,
      }),
      { onConflict: "user_id,category_id,month,currency" },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/budgets");
  });

  it("saves independent global limits per month and currency", async () => {
    const totals = createQueryBuilder({ error: null });
    useSupabase({ monthly_budget_totals: totals });

    await saveMonthlyBudgetTotal({
      month: "2026-10",
      currency: "PEN",
      amount: 2500,
    });

    expect(totals.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        month: "2026-10-01",
        currency: "PEN",
        amount: 2500,
      }),
      { onConflict: "user_id,month,currency" },
    );
  });

  it("rejects income categories before saving a category budget", async () => {
    const categories = createQueryBuilder({ data: null, error: null });
    const budgets = createQueryBuilder({ error: null });
    useSupabase({ categories, budgets });

    await expect(
      saveCategoryBudget({
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        month: "2026-10",
        currency: "PEN",
        amount: 300,
      }),
    ).rejects.toThrow("Selecciona una categoría de gasto válida.");
    expect(budgets.upsert).not.toHaveBeenCalled();
  });
});
