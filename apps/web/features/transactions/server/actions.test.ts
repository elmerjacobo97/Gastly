import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createTransaction,
  deleteTransaction,
  payAllCreditCardTransactions,
  updateTransaction,
} from "@/features/transactions/server/actions";
import { type TransactionValues } from "@/features/transactions/schemas/transaction-schemas";

type SupabaseError = { message: string };
type SupabaseResult = { data?: unknown; error: SupabaseError | null };

type QueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: (
    onFulfilled?: (value: SupabaseResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

function createQueryBuilder(result: SupabaseResult): QueryBuilder {
  const builder = {} as QueryBuilder;
  const chain = () => builder;

  builder.select = vi.fn(chain);
  builder.insert = vi.fn(chain);
  builder.update = vi.fn(chain);
  builder.delete = vi.fn(chain);
  builder.upsert = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.is = vi.fn(chain);
  builder.single = vi.fn(chain);
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);

  return builder;
}

type SupabaseMock = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

function createSupabaseMock(options: {
  user?: { id: string } | null;
  tables: Record<string, QueryBuilder>;
}): SupabaseMock {
  const user = options.user === undefined ? { id: "user-1" } : options.user;

  return {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue(
          user
            ? { data: { user }, error: null }
            : { data: { user: null }, error: { message: "No autenticado" } },
        ),
    },
    from: vi.fn((table: string) => {
      const builder = options.tables[table];
      if (!builder) throw new Error(`Tabla no mockeada: ${table}`);
      return builder;
    }),
  };
}

function useSupabase(mock: SupabaseMock) {
  vi.mocked(createClient).mockResolvedValue(
    mock as unknown as Awaited<ReturnType<typeof createClient>>,
  );
}

function revalidatedRoutes() {
  return vi.mocked(revalidatePath).mock.calls.map(([path]) => path);
}

const validId = "123e4567-e89b-12d3-a456-426614174000";

const validValues: TransactionValues = {
  type: "expense",
  amount: 100,
  description: "Supermercado",
  categoryName: "Comida",
  occurredOn: "2026-09-01",
  notes: "",
  paymentMethod: "cash",
  creditCardName: "",
  creditCardDueOn: "",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createTransaction", () => {
  it("rechaza cuando no hay sesión", async () => {
    useSupabase(createSupabaseMock({ user: null, tables: {} }));

    await expect(createTransaction(validValues)).rejects.toThrow(
      "Debes iniciar sesión para gestionar transacciones.",
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rechaza input inválido con el mensaje de zod", async () => {
    useSupabase(createSupabaseMock({ tables: {} }));

    await expect(
      createTransaction({ ...validValues, amount: 0 }),
    ).rejects.toThrow("Ingresa un monto mayor a 0.");
    await expect(
      createTransaction({ ...validValues, description: "x" }),
    ).rejects.toThrow("Describe la transacción.");
    expect(createClient).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("crea la categoría y la transacción en efectivo", async () => {
    const categories = createQueryBuilder({
      data: { id: "cat-1" },
      error: null,
    });
    const transactions = createQueryBuilder({ error: null });
    const supabase = createSupabaseMock({
      tables: { categories, transactions },
    });
    useSupabase(supabase);

    await createTransaction(validValues);

    expect(supabase.from).toHaveBeenNthCalledWith(1, "categories");
    expect(categories.upsert).toHaveBeenCalledWith(
      { user_id: "user-1", name: "Comida", type: "expense" },
      { onConflict: "user_id,type,name" },
    );
    expect(categories.select).toHaveBeenCalledWith("id");
    expect(categories.single).toHaveBeenCalledTimes(1);

    expect(supabase.from).toHaveBeenNthCalledWith(2, "transactions");
    expect(transactions.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      category_id: "cat-1",
      type: "expense",
      amount: 100,
      description: "Supermercado",
      occurred_on: "2026-09-01",
      notes: null,
      payment_method: "cash",
      credit_card_name: null,
      credit_card_due_on: null,
    });
    expect(revalidatedRoutes()).toEqual(["/transactions", "/", "/reports"]);
  });

  it("guarda los datos de tarjeta de crédito cuando corresponde", async () => {
    const categories = createQueryBuilder({
      data: { id: "cat-2" },
      error: null,
    });
    const transactions = createQueryBuilder({ error: null });
    useSupabase(createSupabaseMock({ tables: { categories, transactions } }));

    await createTransaction({
      ...validValues,
      paymentMethod: "credit_card",
      creditCardName: "Visa",
      creditCardDueOn: "2026-09-20",
      notes: "nota",
    });

    expect(transactions.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_method: "credit_card",
        credit_card_name: "Visa",
        credit_card_due_on: "2026-09-20",
        notes: "nota",
      }),
    );
  });

  it("rechaza cuando falla el upsert de la categoría", async () => {
    const categories = createQueryBuilder({
      data: null,
      error: { message: "categoría duplicada" },
    });
    const transactions = createQueryBuilder({ error: null });
    useSupabase(createSupabaseMock({ tables: { categories, transactions } }));

    await expect(createTransaction(validValues)).rejects.toThrow(
      "categoría duplicada",
    );
    expect(transactions.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rechaza cuando falla el insert de la transacción", async () => {
    const categories = createQueryBuilder({
      data: { id: "cat-1" },
      error: null,
    });
    const transactions = createQueryBuilder({
      error: { message: "insert falló" },
    });
    useSupabase(createSupabaseMock({ tables: { categories, transactions } }));

    await expect(createTransaction(validValues)).rejects.toThrow(
      "insert falló",
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("updateTransaction", () => {
  it("rechaza cuando no hay sesión", async () => {
    useSupabase(createSupabaseMock({ user: null, tables: {} }));

    await expect(updateTransaction(validId, validValues)).rejects.toThrow(
      "Debes iniciar sesión para gestionar transacciones.",
    );
  });

  it("rechaza un id inválido", async () => {
    useSupabase(createSupabaseMock({ tables: {} }));

    await expect(updateTransaction("no-es-uuid", validValues)).rejects.toThrow(
      "Selecciona una transacción válida.",
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("actualiza la transacción en efectivo y limpia el pago de tarjeta", async () => {
    const categories = createQueryBuilder({
      data: { id: "cat-1" },
      error: null,
    });
    const transactions = createQueryBuilder({ error: null });
    useSupabase(createSupabaseMock({ tables: { categories, transactions } }));

    await updateTransaction(validId, validValues);

    expect(transactions.update).toHaveBeenCalledWith({
      category_id: "cat-1",
      type: "expense",
      amount: 100,
      description: "Supermercado",
      occurred_on: "2026-09-01",
      notes: null,
      payment_method: "cash",
      credit_card_name: null,
      credit_card_due_on: null,
      credit_card_paid_on: null,
    });
    expect(transactions.eq).toHaveBeenCalledWith("id", validId);
    expect(revalidatedRoutes()).toEqual(["/transactions", "/", "/reports"]);
  });

  it("no toca credit_card_paid_on al mantener tarjeta de crédito", async () => {
    const categories = createQueryBuilder({
      data: { id: "cat-1" },
      error: null,
    });
    const transactions = createQueryBuilder({ error: null });
    useSupabase(createSupabaseMock({ tables: { categories, transactions } }));

    await updateTransaction(validId, {
      ...validValues,
      paymentMethod: "credit_card",
      creditCardName: "Visa",
      creditCardDueOn: "2026-09-20",
    });

    const updateArg = transactions.update.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(updateArg).not.toHaveProperty("credit_card_paid_on");
    expect(updateArg.credit_card_name).toBe("Visa");
  });

  it("rechaza cuando falla el update", async () => {
    const categories = createQueryBuilder({
      data: { id: "cat-1" },
      error: null,
    });
    const transactions = createQueryBuilder({
      error: { message: "update falló" },
    });
    useSupabase(createSupabaseMock({ tables: { categories, transactions } }));

    await expect(updateTransaction(validId, validValues)).rejects.toThrow(
      "update falló",
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteTransaction", () => {
  it("rechaza cuando no hay sesión", async () => {
    useSupabase(createSupabaseMock({ user: null, tables: {} }));

    await expect(deleteTransaction(validId)).rejects.toThrow(
      "Debes iniciar sesión para gestionar transacciones.",
    );
  });

  it("rechaza un id inválido", async () => {
    useSupabase(createSupabaseMock({ tables: {} }));

    await expect(deleteTransaction("no-es-uuid")).rejects.toThrow(
      "Selecciona una transacción válida.",
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("borra la transacción y revalida", async () => {
    const transactions = createQueryBuilder({ error: null });
    const supabase = createSupabaseMock({ tables: { transactions } });
    useSupabase(supabase);

    await deleteTransaction(validId);

    expect(supabase.from).toHaveBeenCalledWith("transactions");
    expect(transactions.delete).toHaveBeenCalledTimes(1);
    expect(transactions.eq).toHaveBeenCalledWith("id", validId);
    expect(revalidatedRoutes()).toEqual(["/transactions", "/", "/reports"]);
  });

  it("rechaza cuando falla el delete", async () => {
    const transactions = createQueryBuilder({
      error: { message: "delete falló" },
    });
    useSupabase(createSupabaseMock({ tables: { transactions } }));

    await expect(deleteTransaction(validId)).rejects.toThrow("delete falló");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("payAllCreditCardTransactions", () => {
  it("rechaza cuando no hay sesión", async () => {
    useSupabase(createSupabaseMock({ user: null, tables: {} }));

    await expect(payAllCreditCardTransactions("Visa")).rejects.toThrow(
      "Debes iniciar sesión para gestionar transacciones.",
    );
  });

  it("rechaza un nombre de tarjeta vacío", async () => {
    useSupabase(createSupabaseMock({ tables: {} }));

    await expect(payAllCreditCardTransactions("")).rejects.toThrow(
      "Selecciona una tarjeta válida.",
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("paga las tarjetas sin nombre con la fecha de hoy", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 15, 12, 0, 0));
    const transactions = createQueryBuilder({ error: null });
    const supabase = createSupabaseMock({ tables: { transactions } });
    useSupabase(supabase);

    try {
      await payAllCreditCardTransactions(null);
    } finally {
      vi.useRealTimers();
    }

    expect(transactions.update).toHaveBeenCalledWith({
      credit_card_paid_on: "2026-09-15",
    });
    expect(transactions.eq).toHaveBeenCalledWith(
      "payment_method",
      "credit_card",
    );
    expect(transactions.is).toHaveBeenCalledWith("credit_card_paid_on", null);
    expect(transactions.is).toHaveBeenCalledWith("credit_card_name", null);
    expect(revalidatedRoutes()).toEqual(["/transactions", "/", "/reports"]);
  });

  it("paga solo la tarjeta indicada", async () => {
    const transactions = createQueryBuilder({ error: null });
    useSupabase(createSupabaseMock({ tables: { transactions } }));

    await payAllCreditCardTransactions("Visa");

    expect(transactions.eq).toHaveBeenCalledWith("credit_card_name", "Visa");
    expect(transactions.is).not.toHaveBeenCalledWith("credit_card_name", null);
  });

  it("rechaza cuando falla el update masivo", async () => {
    const transactions = createQueryBuilder({
      error: { message: "pago falló" },
    });
    useSupabase(createSupabaseMock({ tables: { transactions } }));

    await expect(payAllCreditCardTransactions("Visa")).rejects.toThrow(
      "pago falló",
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
