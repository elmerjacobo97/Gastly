import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createAccount,
  deleteAccount,
  updateAccount,
} from "@/features/accounts/server/actions";
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
  currency: "PEN",
  balance: 250,
  color: "#3b82f6",
  notes: "",
};

const revalidatedPaths = [
  ["/settings"],
  ["/recurring-payments"],
  ["/installments"],
  ["/"],
];

const accountId = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

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
      currency: "PEN",
      balance: 250,
      color: "#3b82f6",
      notes: null,
    });
    expect(accounts.select).toHaveBeenCalledWith("id");
    expect(accounts.single).toHaveBeenCalledTimes(1);
    expect(vi.mocked(revalidatePath).mock.calls).toEqual(revalidatedPaths);
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

describe("updateAccount", () => {
  const updateValues = {
    name: "BCP",
    balance: -120.5,
    color: "#10b981",
    notes: "",
  };

  it("rechaza un id inválido", async () => {
    await expect(updateAccount("acc-1", updateValues)).rejects.toThrow(
      "Selecciona una cuenta válida.",
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("actualiza la cuenta sin tocar la moneda y acepta saldo negativo", async () => {
    const accounts = createQueryBuilder({ error: null });
    useSupabase(createSupabaseMock({ tables: { accounts } }));

    await updateAccount(accountId, updateValues);

    expect(accounts.update).toHaveBeenCalledWith({
      name: "BCP",
      balance: -120.5,
      color: "#10b981",
      notes: null,
    });
    expect(accounts.eq).toHaveBeenCalledWith("id", accountId);
    expect(vi.mocked(revalidatePath).mock.calls).toEqual(revalidatedPaths);
  });

  it("rechaza cuando falla el update", async () => {
    const accounts = createQueryBuilder({ error: { message: "update falló" } });
    useSupabase(createSupabaseMock({ tables: { accounts } }));

    await expect(updateAccount(accountId, updateValues)).rejects.toThrow(
      "update falló",
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteAccount", () => {
  it("rechaza un id inválido", async () => {
    await expect(deleteAccount("acc-1")).rejects.toThrow(
      "Selecciona una cuenta válida.",
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("elimina la cuenta por id", async () => {
    const accounts = createQueryBuilder({ error: null });
    useSupabase(createSupabaseMock({ tables: { accounts } }));

    await deleteAccount(accountId);

    expect(accounts.delete).toHaveBeenCalledTimes(1);
    expect(accounts.eq).toHaveBeenCalledWith("id", accountId);
    expect(vi.mocked(revalidatePath).mock.calls).toEqual(revalidatedPaths);
  });

  it("rechaza cuando falla el delete", async () => {
    const accounts = createQueryBuilder({ error: { message: "delete falló" } });
    useSupabase(createSupabaseMock({ tables: { accounts } }));

    await expect(deleteAccount(accountId)).rejects.toThrow("delete falló");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
