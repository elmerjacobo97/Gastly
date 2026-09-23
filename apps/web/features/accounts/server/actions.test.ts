import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAccount } from "@/features/accounts/server/actions";
import { type AccountValues } from "@/features/accounts/schemas/account-schemas";

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

const validValues: AccountValues = {
  name: "Ahorros",
  balance: 250,
  color: "#3b82f6",
  notes: "",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createAccount", () => {
  it("rechaza cuando no hay sesión", async () => {
    useSupabase(createSupabaseMock({ user: null, tables: {} }));

    await expect(createAccount(validValues)).rejects.toThrow(
      "Debes iniciar sesión.",
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rechaza input inválido con el mensaje de zod", async () => {
    useSupabase(createSupabaseMock({ tables: {} }));

    await expect(createAccount({ ...validValues, name: "a" })).rejects.toThrow(
      "Ingresa el nombre de la cuenta.",
    );
    await expect(
      createAccount({ ...validValues, balance: -1 }),
    ).rejects.toThrow("El saldo no puede ser negativo.");
    expect(createClient).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("crea la cuenta y devuelve el id", async () => {
    const accounts = createQueryBuilder({
      data: { id: "acc-1" },
      error: null,
    });
    const supabase = createSupabaseMock({ tables: { accounts } });
    useSupabase(supabase);

    const id = await createAccount(validValues);

    expect(id).toBe("acc-1");
    expect(supabase.from).toHaveBeenCalledWith("accounts");
    expect(accounts.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      name: "Ahorros",
      balance: 250,
      color: "#3b82f6",
      notes: null,
    });
    expect(accounts.select).toHaveBeenCalledWith("id");
    expect(accounts.single).toHaveBeenCalledTimes(1);
    expect(vi.mocked(revalidatePath).mock.calls).toEqual([["/"]]);
  });

  it("guarda las notas cuando vienen", async () => {
    const accounts = createQueryBuilder({
      data: { id: "acc-2" },
      error: null,
    });
    useSupabase(createSupabaseMock({ tables: { accounts } }));

    await createAccount({ ...validValues, notes: "cuenta de emergencia" });

    expect(accounts.insert).toHaveBeenCalledWith(
      expect.objectContaining({ notes: "cuenta de emergencia" }),
    );
  });

  it("rechaza cuando falla el insert", async () => {
    const accounts = createQueryBuilder({
      data: null,
      error: { message: "insert falló" },
    });
    useSupabase(createSupabaseMock({ tables: { accounts } }));

    await expect(createAccount(validValues)).rejects.toThrow("insert falló");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
