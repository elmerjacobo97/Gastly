import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createTransaction,
  deleteTransaction,
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

// Each await consumes the next result; the last one repeats.
function createQueryBuilder(
  result: SupabaseResult,
  ...next: SupabaseResult[]
): QueryBuilder {
  const queue = [result, ...next];
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
    Promise.resolve(queue.length > 1 ? queue.shift()! : queue[0]).then(
      onFulfilled,
      onRejected,
    );

  return builder;
}

type SupabaseMock = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
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
    rpc: vi.fn().mockResolvedValue({ error: null }),
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
  currency: "PEN",
  description: "Supermercado",
  categoryName: "Comida",
  occurredOn: "2026-09-01",
  notes: "",
};

const accountId = "223e4567-e89b-12d3-a456-426614174000";

const noAccountEffect: SupabaseResult = {
  data: {
    account_id: null,
    type: "expense",
    amount: 100,
    account_amount: null,
  },
  error: null,
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

  it("crea la categoría y la transacción", async () => {
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
      currency: "PEN",
      description: "Supermercado",
      occurred_on: "2026-09-01",
      notes: null,
      account_id: null,
      account_amount: null,
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(revalidatedRoutes()).toEqual([
      "/transactions",
      "/",
      "/reports",
      "/budgets",
    ]);
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

  it("actualiza la transacción", async () => {
    const categories = createQueryBuilder({
      data: { id: "cat-1" },
      error: null,
    });
    const transactions = createQueryBuilder(noAccountEffect, { error: null });
    useSupabase(createSupabaseMock({ tables: { categories, transactions } }));

    await updateTransaction(validId, validValues);

    expect(transactions.update).toHaveBeenCalledWith({
      category_id: "cat-1",
      type: "expense",
      amount: 100,
      currency: "PEN",
      description: "Supermercado",
      occurred_on: "2026-09-01",
      notes: null,
      account_id: null,
      account_amount: null,
    });
    expect(transactions.eq).toHaveBeenCalledWith("id", validId);
    expect(revalidatedRoutes()).toEqual([
      "/transactions",
      "/",
      "/reports",
      "/budgets",
    ]);
  });

  it("rechaza cuando falla el update", async () => {
    const categories = createQueryBuilder({
      data: { id: "cat-1" },
      error: null,
    });
    const transactions = createQueryBuilder(noAccountEffect, {
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
    const transactions = createQueryBuilder(noAccountEffect, { error: null });
    const supabase = createSupabaseMock({ tables: { transactions } });
    useSupabase(supabase);

    await deleteTransaction(validId);

    expect(supabase.from).toHaveBeenCalledWith("transactions");
    expect(transactions.delete).toHaveBeenCalledTimes(1);
    expect(transactions.eq).toHaveBeenCalledWith("id", validId);
    expect(revalidatedRoutes()).toEqual([
      "/transactions",
      "/",
      "/reports",
      "/budgets",
    ]);
  });

  it("rechaza cuando falla el delete", async () => {
    const transactions = createQueryBuilder(noAccountEffect, {
      error: { message: "delete falló" },
    });
    useSupabase(createSupabaseMock({ tables: { transactions } }));

    await expect(deleteTransaction(validId)).rejects.toThrow("delete falló");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("movimientos de cuenta", () => {
  const categories = () =>
    createQueryBuilder({ data: { id: "cat-1" }, error: null });
  const accountsTable = (currency: string) =>
    createQueryBuilder({ data: { currency }, error: null });

  it("un gasto en la misma moneda descuenta el monto de la cuenta", async () => {
    const transactions = createQueryBuilder({ error: null });
    const supabase = createSupabaseMock({
      tables: {
        categories: categories(),
        accounts: accountsTable("PEN"),
        transactions,
      },
    });
    useSupabase(supabase);

    await createTransaction({ ...validValues, accountId });

    expect(transactions.insert).toHaveBeenCalledWith(
      expect.objectContaining({ account_id: accountId, account_amount: null }),
    );
    expect(supabase.rpc).toHaveBeenCalledWith("decrement_account_balance", {
      p_account_id: accountId,
      p_amount: 100,
    });
  });

  it("un ingreso suma a la cuenta", async () => {
    const supabase = createSupabaseMock({
      tables: {
        categories: categories(),
        accounts: accountsTable("PEN"),
        transactions: createQueryBuilder({ error: null }),
      },
    });
    useSupabase(supabase);

    await createTransaction({ ...validValues, type: "income", accountId });

    expect(supabase.rpc).toHaveBeenCalledWith("increment_account_balance", {
      p_account_id: accountId,
      p_amount: 100,
    });
  });

  it("exige el monto en la moneda de la cuenta cuando difiere", async () => {
    const supabase = createSupabaseMock({
      tables: {
        categories: categories(),
        accounts: accountsTable("USD"),
        transactions: createQueryBuilder({ error: null }),
      },
    });
    useSupabase(supabase);

    await expect(
      createTransaction({ ...validValues, accountId }),
    ).rejects.toThrow("Ingresa el monto en USD que se movió en la cuenta.");
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("usa el monto de la cuenta cuando la moneda difiere", async () => {
    const transactions = createQueryBuilder({ error: null });
    const supabase = createSupabaseMock({
      tables: {
        categories: categories(),
        accounts: accountsTable("USD"),
        transactions,
      },
    });
    useSupabase(supabase);

    await createTransaction({ ...validValues, accountId, accountAmount: 27 });

    expect(transactions.insert).toHaveBeenCalledWith(
      expect.objectContaining({ account_amount: 27 }),
    );
    expect(supabase.rpc).toHaveBeenCalledWith("decrement_account_balance", {
      p_account_id: accountId,
      p_amount: 27,
    });
  });

  it("rechaza una cuenta que no existe", async () => {
    useSupabase(
      createSupabaseMock({
        tables: {
          categories: categories(),
          accounts: createQueryBuilder({ data: null, error: null }),
          transactions: createQueryBuilder({ error: null }),
        },
      }),
    );

    await expect(
      createTransaction({ ...validValues, accountId }),
    ).rejects.toThrow("La cuenta seleccionada no existe.");
  });

  it("al editar revierte el efecto anterior y aplica el nuevo", async () => {
    const otherAccount = "323e4567-e89b-12d3-a456-426614174000";
    const transactions = createQueryBuilder(
      {
        data: {
          account_id: accountId,
          type: "expense",
          amount: 100,
          account_amount: 30,
        },
        error: null,
      },
      { error: null },
    );
    const supabase = createSupabaseMock({
      tables: {
        categories: categories(),
        accounts: accountsTable("PEN"),
        transactions,
      },
    });
    useSupabase(supabase);

    await updateTransaction(validId, {
      ...validValues,
      amount: 80,
      accountId: otherAccount,
    });

    expect(supabase.rpc.mock.calls).toEqual([
      ["increment_account_balance", { p_account_id: accountId, p_amount: 30 }],
      [
        "decrement_account_balance",
        { p_account_id: otherAccount, p_amount: 80 },
      ],
    ]);
  });

  it("asignar cuenta a una transacción sin cuenta solo la etiqueta", async () => {
    const transactions = createQueryBuilder(noAccountEffect, { error: null });
    const supabase = createSupabaseMock({
      tables: {
        categories: categories(),
        accounts: accountsTable("PEN"),
        transactions,
      },
    });
    useSupabase(supabase);

    await updateTransaction(validId, { ...validValues, accountId });

    expect(transactions.update).toHaveBeenCalledWith(
      expect.objectContaining({ account_id: accountId }),
    );
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("al borrar devuelve el saldo de la cuenta", async () => {
    const transactions = createQueryBuilder(
      {
        data: {
          account_id: accountId,
          type: "income",
          amount: 15,
          account_amount: null,
        },
        error: null,
      },
      { error: null },
    );
    const supabase = createSupabaseMock({ tables: { transactions } });
    useSupabase(supabase);

    await deleteTransaction(validId);

    expect(supabase.rpc).toHaveBeenCalledWith("decrement_account_balance", {
      p_account_id: accountId,
      p_amount: 15,
    });
  });

  it("no ajusta saldos si falla el delete", async () => {
    const transactions = createQueryBuilder(
      {
        data: {
          account_id: accountId,
          type: "expense",
          amount: 50,
          account_amount: null,
        },
        error: null,
      },
      { error: { message: "delete falló" } },
    );
    const supabase = createSupabaseMock({ tables: { transactions } });
    useSupabase(supabase);

    await expect(deleteTransaction(validId)).rejects.toThrow("delete falló");
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
