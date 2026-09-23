import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  addContribution,
  createSavingsGoal,
  deleteSavingsGoal,
  updateSavingsGoal,
} from "@/features/savings/server/actions";
import {
  type ContributionValues,
  type SavingsGoalValues,
} from "@/features/savings/schemas/savings-schemas";

type MockResult = {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
};

type RecordedCall = { table: string; method: string; args: unknown[] };

function createSupabaseMock() {
  const responses = new Map<string, MockResult[]>();
  const calls: RecordedCall[] = [];

  function queue(table: string, result: MockResult) {
    const list = responses.get(table) ?? [];
    list.push(result);
    responses.set(table, list);
  }

  function take(table: string): MockResult {
    const result = responses.get(table)?.shift();
    if (!result) {
      throw new Error(`Mock sin respuesta configurada para "${table}".`);
    }
    return result;
  }

  const chainMethods = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "in",
    "is",
    "not",
    "or",
    "order",
    "limit",
    "match",
    "filter",
    "gte",
    "lte",
  ];

  function createBuilder(table: string) {
    const builder: Record<string, unknown> = {};

    const chain =
      (method: string) =>
      (...args: unknown[]) => {
        calls.push({ table, method, args });
        return builder;
      };

    for (const method of chainMethods) {
      builder[method] = vi.fn(chain(method));
    }

    const terminal =
      (method: string) =>
      (...args: unknown[]) => {
        calls.push({ table, method, args });
        return Promise.resolve(take(table));
      };

    builder.single = vi.fn(terminal("single"));
    builder.maybeSingle = vi.fn(terminal("maybeSingle"));
    builder.then = (onFulfilled: (value: MockResult) => unknown) =>
      Promise.resolve(take(table)).then(onFulfilled);

    return builder;
  }

  const getUser = vi.fn();
  const from = vi.fn((table: string) => {
    calls.push({ table, method: "from", args: [table] });
    return createBuilder(table);
  });

  return {
    client: { auth: { getUser }, from },
    queue,
    callsOn: (table: string, method: string) =>
      calls.filter((call) => call.table === table && call.method === method),
    setUser: (
      user: { id: string } | null,
      error: { message: string } | null = null,
    ) => {
      getUser.mockResolvedValue({ data: { user }, error });
    },
  };
}

type SupabaseMock = ReturnType<typeof createSupabaseMock>;

const USER_ID = "11111111-1111-4111-8111-111111111111";
const GOAL_ID = "22222222-2222-4222-8222-222222222222";

const revalidatePathMock = vi.mocked(revalidatePath);

const validGoal: SavingsGoalValues = {
  name: "Viaje a Japón",
  targetAmount: 1200,
  targetDate: "2026-12-01",
  color: "#10b981",
  notes: "Ahorro mensual",
};

const validContribution: ContributionValues = {
  amount: 75,
  occurredOn: "2026-02-01",
  notes: "Aporte mensual",
};

let supabase: SupabaseMock;

beforeEach(() => {
  vi.clearAllMocks();
  supabase = createSupabaseMock();
  supabase.setUser({ id: USER_ID });
  vi.mocked(createClient).mockResolvedValue(
    supabase.client as unknown as Awaited<ReturnType<typeof createClient>>,
  );
});

describe("createSavingsGoal", () => {
  it("rechaza cuando no hay usuario autenticado", async () => {
    supabase.setUser(null);

    await expect(createSavingsGoal(validGoal)).rejects.toThrow(
      "Debes iniciar sesión.",
    );
  });

  it("rechaza el input inválido con el mensaje de zod", async () => {
    await expect(
      createSavingsGoal({ ...validGoal, name: "A" }),
    ).rejects.toThrow("Ingresa el nombre de la meta.");
  });

  it("inserta la meta y revalida /savings", async () => {
    supabase.queue("savings_goals", { data: { id: GOAL_ID }, error: null });

    await expect(createSavingsGoal(validGoal)).resolves.toBe(GOAL_ID);

    expect(supabase.callsOn("savings_goals", "insert")[0]?.args[0]).toEqual({
      user_id: USER_ID,
      name: "Viaje a Japón",
      target_amount: 1200,
      target_date: "2026-12-01",
      color: "#10b981",
      notes: "Ahorro mensual",
    });
    expect(supabase.callsOn("savings_goals", "select")[0]?.args[0]).toBe("id");
    expect(supabase.callsOn("savings_goals", "single")).toHaveLength(1);
    expect(revalidatePathMock).toHaveBeenCalledWith("/savings");
  });

  it("propaga el error de Supabase sin revalidar", async () => {
    supabase.queue("savings_goals", { error: { message: "falló el insert" } });

    await expect(createSavingsGoal(validGoal)).rejects.toThrow(
      "falló el insert",
    );
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe("updateSavingsGoal", () => {
  it("rechaza cuando no hay usuario autenticado", async () => {
    supabase.setUser(null);

    await expect(updateSavingsGoal(GOAL_ID, validGoal)).rejects.toThrow(
      "Debes iniciar sesión.",
    );
  });

  it("rechaza un id inválido con el mensaje de zod", async () => {
    await expect(updateSavingsGoal("no-es-uuid", validGoal)).rejects.toThrow(
      "Selecciona una meta válida.",
    );
  });

  it("rechaza valores inválidos con el mensaje de zod", async () => {
    await expect(
      updateSavingsGoal(GOAL_ID, { ...validGoal, targetAmount: 0 }),
    ).rejects.toThrow("El monto objetivo debe ser mayor a 0.");
  });

  it("actualiza la meta y revalida /savings", async () => {
    supabase.queue("savings_goals", { error: null });

    await expect(
      updateSavingsGoal(GOAL_ID, validGoal),
    ).resolves.toBeUndefined();

    expect(supabase.callsOn("savings_goals", "update")[0]?.args[0]).toEqual({
      name: "Viaje a Japón",
      target_amount: 1200,
      target_date: "2026-12-01",
      color: "#10b981",
      notes: "Ahorro mensual",
    });
    expect(supabase.callsOn("savings_goals", "eq")[0]?.args).toEqual([
      "id",
      GOAL_ID,
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/savings");
  });
});

describe("deleteSavingsGoal", () => {
  it("rechaza cuando no hay usuario autenticado", async () => {
    supabase.setUser(null);

    await expect(deleteSavingsGoal(GOAL_ID)).rejects.toThrow(
      "Debes iniciar sesión.",
    );
  });

  it("rechaza un id inválido con el mensaje de zod", async () => {
    await expect(deleteSavingsGoal("no-es-uuid")).rejects.toThrow(
      "Selecciona una meta válida.",
    );
  });

  it("elimina la meta y revalida /savings", async () => {
    supabase.queue("savings_goals", { error: null });

    await expect(deleteSavingsGoal(GOAL_ID)).resolves.toBeUndefined();

    expect(supabase.callsOn("savings_goals", "delete")).toHaveLength(1);
    expect(supabase.callsOn("savings_goals", "eq")[0]?.args).toEqual([
      "id",
      GOAL_ID,
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/savings");
  });
});

describe("addContribution", () => {
  it("rechaza cuando no hay usuario autenticado", async () => {
    supabase.setUser(null);

    await expect(addContribution(GOAL_ID, validContribution)).rejects.toThrow(
      "Debes iniciar sesión.",
    );
  });

  it("rechaza un id de meta inválido con el mensaje de zod", async () => {
    await expect(
      addContribution("no-es-uuid", validContribution),
    ).rejects.toThrow("Selecciona una meta válida.");
  });

  it("rechaza un monto inválido con el mensaje de zod", async () => {
    await expect(
      addContribution(GOAL_ID, { ...validContribution, amount: 0 }),
    ).rejects.toThrow("El monto debe ser mayor a 0.");
  });

  it("suma el aporte al monto actual y revalida /savings", async () => {
    supabase.queue("savings_goals", {
      data: { current_amount: "100.50" },
      error: null,
    });
    supabase.queue("savings_goals", { error: null });

    await expect(
      addContribution(GOAL_ID, validContribution),
    ).resolves.toBeUndefined();

    expect(supabase.callsOn("savings_goals", "select")[0]?.args[0]).toBe(
      "current_amount",
    );
    expect(supabase.callsOn("savings_goals", "update")[0]?.args[0]).toEqual({
      current_amount: 175.5,
    });
    expect(supabase.callsOn("savings_goals", "eq")).toHaveLength(2);
    expect(revalidatePathMock).toHaveBeenCalledWith("/savings");
  });

  it("propaga el error al leer la meta y no actualiza", async () => {
    supabase.queue("savings_goals", {
      data: null,
      error: { message: "meta perdida" },
    });

    await expect(addContribution(GOAL_ID, validContribution)).rejects.toThrow(
      "meta perdida",
    );
    expect(supabase.callsOn("savings_goals", "update")).toHaveLength(0);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("propaga el error al actualizar la meta sin revalidar", async () => {
    supabase.queue("savings_goals", {
      data: { current_amount: 100 },
      error: null,
    });
    supabase.queue("savings_goals", {
      error: { message: "no se pudo actualizar" },
    });

    await expect(addContribution(GOAL_ID, validContribution)).rejects.toThrow(
      "no se pudo actualizar",
    );
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
