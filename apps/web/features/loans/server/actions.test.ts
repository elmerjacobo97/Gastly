import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createLoan,
  deleteLoanBalances,
  deleteLoanDisbursement,
  deleteLoanPayment,
  recordLoanPayment,
  updateLoanDisbursement,
  updateLoanPayment,
  updateLoanPerson,
} from "@/features/loans/server/actions";
import {
  type LoanDisbursementValues,
  type LoanPaymentValues,
  type LoanValues,
} from "@/features/loans/schemas/loan-schemas";

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
const LOAN_ID = "22222222-2222-4222-8222-222222222222";
const DISBURSEMENT_ID = "33333333-3333-4333-8333-333333333333";
const PAYMENT_ID = "44444444-4444-4444-8444-444444444444";
const OTHER_PAYMENT_ID = "66666666-6666-4666-8666-666666666666";

const revalidatePathMock = vi.mocked(revalidatePath);

const validLoan: LoanValues = {
  direction: "lent",
  personName: "María López",
  amount: 100,
  currency: "PEN",
  interestRate: 0,
  description: "Préstamo",
  expectedOn: "2026-03-01",
  loanedOn: "2026-01-10",
  notes: "Sin apuro",
};

const validPayment: LoanPaymentValues = {
  amount: 40,
  occurredOn: "2026-01-20",
  notes: "",
};

const validDisbursement: LoanDisbursementValues = {
  amount: 120,
  occurredOn: "2026-01-05",
  description: "",
  notes: "",
  interestRate: 2,
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

describe("createLoan", () => {
  it("rechaza cuando no hay usuario autenticado", async () => {
    supabase.setUser(null);

    await expect(createLoan(validLoan)).rejects.toThrow(
      "Debes iniciar sesión.",
    );
  });

  it("rechaza el input inválido con el mensaje de zod", async () => {
    await expect(createLoan({ ...validLoan, personName: "A" })).rejects.toThrow(
      "Ingresa el nombre de la persona.",
    );
  });

  it("crea el préstamo y su desembolso, y revalida /loans", async () => {
    supabase.queue("loans", { data: [], error: null });
    supabase.queue("loans", { data: { id: LOAN_ID }, error: null });
    supabase.queue("loan_disbursements", { error: null });

    await expect(createLoan(validLoan)).resolves.toBeUndefined();

    expect(supabase.callsOn("loans", "insert")[0]?.args[0]).toEqual({
      user_id: USER_ID,
      direction: "lent",
      person_name: "María López",
      amount: 100,
      currency: "PEN",
      expected_on: "2026-03-01",
      loaned_on: "2026-01-10",
      notes: "Sin apuro",
    });
    expect(
      supabase.callsOn("loan_disbursements", "insert")[0]?.args[0],
    ).toEqual({
      loan_id: LOAN_ID,
      amount: 100,
      occurred_on: "2026-01-10",
      description: "Préstamo",
      notes: "Sin apuro",
      interest_rate: 0,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/loans");
  });

  it("agrega el desembolso al saldo existente y sincroniza los totales", async () => {
    supabase.queue("loans", {
      data: [{ id: LOAN_ID, person_name: "maría lópez" }],
      error: null,
    });
    supabase.queue("loan_disbursements", { error: null });
    supabase.queue("loan_disbursements", {
      data: [
        { amount: 50, occurred_on: "2026-01-05" },
        { amount: 25.5, occurred_on: "2026-01-02" },
      ],
      error: null,
    });
    supabase.queue("loans", { error: null });
    supabase.queue("loans", { error: null });

    await expect(createLoan(validLoan)).resolves.toBeUndefined();

    expect(supabase.callsOn("loans", "insert")).toHaveLength(0);
    expect(
      supabase.callsOn("loan_disbursements", "insert")[0]?.args[0],
    ).toEqual({
      loan_id: LOAN_ID,
      amount: 100,
      occurred_on: "2026-01-10",
      description: "Préstamo",
      notes: "Sin apuro",
      interest_rate: 0,
    });
    expect(supabase.callsOn("loans", "update")[0]?.args[0]).toEqual({
      amount: 75.5,
      loaned_on: "2026-01-02",
    });
    expect(supabase.callsOn("loans", "update")[1]?.args[0]).toEqual({
      expected_on: "2026-03-01",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/loans");
  });

  it("borra el préstamo si falla el insert del desembolso", async () => {
    supabase.queue("loans", { data: [], error: null });
    supabase.queue("loans", { data: { id: LOAN_ID }, error: null });
    supabase.queue("loan_disbursements", {
      error: { message: "no se pudo insertar" },
    });
    supabase.queue("loans", { error: null });

    await expect(createLoan(validLoan)).rejects.toThrow("no se pudo insertar");

    expect(supabase.callsOn("loans", "delete")).toHaveLength(1);
    expect(supabase.callsOn("loans", "eq").at(-1)?.args).toEqual([
      "id",
      LOAN_ID,
    ]);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe("updateLoanPerson", () => {
  it("rechaza cuando no hay usuario autenticado", async () => {
    supabase.setUser(null);

    await expect(
      updateLoanPerson([LOAN_ID], { personName: "María López" }),
    ).rejects.toThrow("Debes iniciar sesión.");
  });

  it("rechaza ids inválidos con el mensaje de zod", async () => {
    await expect(
      updateLoanPerson(["no-es-uuid"], { personName: "María López" }),
    ).rejects.toThrow("Selecciona un préstamo válido.");
  });

  it("rechaza un nombre inválido con el mensaje de zod", async () => {
    await expect(
      updateLoanPerson([LOAN_ID], { personName: "A" }),
    ).rejects.toThrow("Ingresa el nombre de la persona.");
  });

  it("rechaza una lista vacía de préstamos", async () => {
    await expect(
      updateLoanPerson([], { personName: "María López" }),
    ).rejects.toThrow("No hay préstamos para actualizar.");
  });

  it("actualiza los saldos y revalida /loans", async () => {
    supabase.queue("loans", { error: null });

    await expect(
      updateLoanPerson([LOAN_ID], { personName: "María López" }),
    ).resolves.toBeUndefined();

    expect(supabase.callsOn("loans", "update")[0]?.args[0]).toEqual({
      person_name: "María López",
      expected_on: null,
      notes: null,
    });
    expect(supabase.callsOn("loans", "in")[0]?.args).toEqual(["id", [LOAN_ID]]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/loans");
  });
});

describe("deleteLoanBalances", () => {
  it("rechaza cuando no hay usuario autenticado", async () => {
    supabase.setUser(null);

    await expect(deleteLoanBalances([LOAN_ID])).rejects.toThrow(
      "Debes iniciar sesión.",
    );
  });

  it("rechaza ids inválidos con el mensaje de zod", async () => {
    await expect(deleteLoanBalances(["no-es-uuid"])).rejects.toThrow(
      "Selecciona un préstamo válido.",
    );
  });

  it("no hace nada si la lista está vacía", async () => {
    await expect(deleteLoanBalances([])).resolves.toBeUndefined();

    expect(supabase.callsOn("loans", "delete")).toHaveLength(0);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("elimina los saldos y revalida /loans", async () => {
    supabase.queue("loans", { error: null });

    await expect(deleteLoanBalances([LOAN_ID])).resolves.toBeUndefined();

    expect(supabase.callsOn("loans", "delete")).toHaveLength(1);
    expect(supabase.callsOn("loans", "in")[0]?.args).toEqual(["id", [LOAN_ID]]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/loans");
  });
});

describe("recordLoanPayment", () => {
  it("rechaza cuando no hay usuario autenticado", async () => {
    supabase.setUser(null);

    await expect(
      recordLoanPayment(LOAN_ID, DISBURSEMENT_ID, validPayment),
    ).rejects.toThrow("Debes iniciar sesión.");
  });

  it("rechaza un id de préstamo inválido con el mensaje de zod", async () => {
    await expect(
      recordLoanPayment("no-es-uuid", DISBURSEMENT_ID, validPayment),
    ).rejects.toThrow("Selecciona un préstamo válido.");
  });

  it("rechaza un id de desembolso inválido con el mensaje de zod", async () => {
    await expect(
      recordLoanPayment(LOAN_ID, "no-es-uuid", validPayment),
    ).rejects.toThrow("Selecciona un préstamo válido.");
  });

  it("rechaza un monto inválido con el mensaje de zod", async () => {
    await expect(
      recordLoanPayment(LOAN_ID, DISBURSEMENT_ID, {
        ...validPayment,
        amount: 0,
      }),
    ).rejects.toThrow("El monto debe ser mayor a 0.");
  });

  it("registra la devolución y revalida /loans", async () => {
    supabase.queue("loan_disbursements", {
      data: {
        id: DISBURSEMENT_ID,
        amount: 100,
        occurred_on: "2026-01-10",
        interest_rate: 0,
      },
      error: null,
    });
    supabase.queue("loan_payments", { data: [], error: null });
    supabase.queue("loan_payments", { error: null });

    await expect(
      recordLoanPayment(LOAN_ID, DISBURSEMENT_ID, validPayment),
    ).resolves.toBeUndefined();

    expect(supabase.callsOn("loan_payments", "insert")[0]?.args[0]).toEqual({
      loan_id: LOAN_ID,
      disbursement_id: DISBURSEMENT_ID,
      amount: 40,
      occurred_on: "2026-01-20",
      notes: null,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/loans");
  });

  it("rechaza una devolución anterior al préstamo", async () => {
    supabase.queue("loan_disbursements", {
      data: {
        id: DISBURSEMENT_ID,
        amount: 100,
        occurred_on: "2026-02-01",
        interest_rate: 0,
      },
      error: null,
    });

    await expect(
      recordLoanPayment(LOAN_ID, DISBURSEMENT_ID, validPayment),
    ).rejects.toThrow("La devolución no puede ser anterior al préstamo.");

    expect(supabase.callsOn("loan_payments", "select")).toHaveLength(0);
    expect(supabase.callsOn("loan_payments", "insert")).toHaveLength(0);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rechaza una devolución mayor al saldo pendiente", async () => {
    supabase.queue("loan_disbursements", {
      data: {
        id: DISBURSEMENT_ID,
        amount: 100,
        occurred_on: "2026-01-10",
        interest_rate: 0,
      },
      error: null,
    });
    supabase.queue("loan_payments", { data: [], error: null });

    await expect(
      recordLoanPayment(LOAN_ID, DISBURSEMENT_ID, {
        ...validPayment,
        amount: 150,
      }),
    ).rejects.toThrow("El monto supera el saldo pendiente de este préstamo.");

    expect(supabase.callsOn("loan_payments", "insert")).toHaveLength(0);
  });

  it("propaga el error cuando el desembolso no existe", async () => {
    supabase.queue("loan_disbursements", {
      data: null,
      error: { message: "desembolso perdido" },
    });

    await expect(
      recordLoanPayment(LOAN_ID, DISBURSEMENT_ID, validPayment),
    ).rejects.toThrow("desembolso perdido");
  });
});

describe("updateLoanPayment", () => {
  it("rechaza cuando no hay usuario autenticado", async () => {
    supabase.setUser(null);

    await expect(updateLoanPayment(PAYMENT_ID, validPayment)).rejects.toThrow(
      "Debes iniciar sesión.",
    );
  });

  it("rechaza un id inválido con el mensaje de zod", async () => {
    await expect(updateLoanPayment("no-es-uuid", validPayment)).rejects.toThrow(
      "Selecciona una devolución válida.",
    );
  });

  it("actualiza la devolución excluyéndose a sí misma y revalida /loans", async () => {
    supabase.queue("loan_payments", {
      data: { disbursement_id: DISBURSEMENT_ID },
      error: null,
    });
    supabase.queue("loan_disbursements", {
      data: {
        id: DISBURSEMENT_ID,
        amount: 100,
        occurred_on: "2026-01-10",
        interest_rate: 0,
      },
      error: null,
    });
    supabase.queue("loan_payments", { data: [], error: null });
    supabase.queue("loan_payments", { error: null });

    await expect(
      updateLoanPayment(PAYMENT_ID, {
        ...validPayment,
        amount: 60,
        occurredOn: "2026-02-01",
      }),
    ).resolves.toBeUndefined();

    expect(supabase.callsOn("loan_payments", "neq")[0]?.args).toEqual([
      "id",
      PAYMENT_ID,
    ]);
    const updateCalls = supabase.callsOn("loan_payments", "update");
    expect(updateCalls[0]?.args[0]).toEqual({
      amount: 60,
      occurred_on: "2026-02-01",
      notes: null,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/loans");
  });

  it("propaga el error cuando la devolución no existe", async () => {
    supabase.queue("loan_payments", { data: null, error: null });

    await expect(updateLoanPayment(PAYMENT_ID, validPayment)).rejects.toThrow(
      "Devolución no encontrada.",
    );
  });

  it("rechaza cambios que dejan un monto sin aplicar", async () => {
    supabase.queue("loan_payments", {
      data: { disbursement_id: DISBURSEMENT_ID },
      error: null,
    });
    supabase.queue("loan_disbursements", {
      data: {
        id: DISBURSEMENT_ID,
        amount: 100,
        occurred_on: "2026-01-10",
        interest_rate: 0,
      },
      error: null,
    });
    supabase.queue("loan_payments", {
      data: [
        {
          id: OTHER_PAYMENT_ID,
          disbursement_id: DISBURSEMENT_ID,
          amount: 60,
          occurred_on: "2026-02-01",
        },
      ],
      error: null,
    });

    await expect(
      updateLoanPayment(PAYMENT_ID, {
        ...validPayment,
        amount: 80,
        occurredOn: "2026-02-02",
      }),
    ).rejects.toThrow("El monto supera el saldo pendiente de este préstamo.");

    expect(supabase.callsOn("loan_payments", "update")).toHaveLength(0);
  });
});

describe("deleteLoanPayment", () => {
  it("rechaza cuando no hay usuario autenticado", async () => {
    supabase.setUser(null);

    await expect(deleteLoanPayment(PAYMENT_ID)).rejects.toThrow(
      "Debes iniciar sesión.",
    );
  });

  it("rechaza un id inválido con el mensaje de zod", async () => {
    await expect(deleteLoanPayment("no-es-uuid")).rejects.toThrow(
      "Selecciona una devolución válida.",
    );
  });

  it("elimina la devolución y revalida /loans", async () => {
    supabase.queue("loan_payments", { error: null });

    await expect(deleteLoanPayment(PAYMENT_ID)).resolves.toBeUndefined();

    expect(supabase.callsOn("loan_payments", "delete")).toHaveLength(1);
    expect(supabase.callsOn("loan_payments", "eq")[0]?.args).toEqual([
      "id",
      PAYMENT_ID,
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/loans");
  });
});

describe("updateLoanDisbursement", () => {
  it("rechaza cuando no hay usuario autenticado", async () => {
    supabase.setUser(null);

    await expect(
      updateLoanDisbursement(DISBURSEMENT_ID, validDisbursement),
    ).rejects.toThrow("Debes iniciar sesión.");
  });

  it("rechaza un id inválido con el mensaje de zod", async () => {
    await expect(
      updateLoanDisbursement("no-es-uuid", validDisbursement),
    ).rejects.toThrow("Selecciona un préstamo válido.");
  });

  it("rechaza un monto inválido con el mensaje de zod", async () => {
    await expect(
      updateLoanDisbursement(DISBURSEMENT_ID, {
        ...validDisbursement,
        amount: 0,
      }),
    ).rejects.toThrow("El monto debe ser mayor a 0.");
  });

  it("actualiza el desembolso, sincroniza totales y revalida /loans", async () => {
    supabase.queue("loan_disbursements", {
      data: { loan_id: LOAN_ID },
      error: null,
    });
    supabase.queue("loan_payments", { data: [], error: null });
    supabase.queue("loan_disbursements", { error: null });
    supabase.queue("loan_disbursements", {
      data: [{ amount: 120, occurred_on: "2026-01-05" }],
      error: null,
    });
    supabase.queue("loans", { error: null });

    await expect(
      updateLoanDisbursement(DISBURSEMENT_ID, validDisbursement),
    ).resolves.toBeUndefined();

    const updateCalls = supabase.callsOn("loan_disbursements", "update");
    expect(updateCalls[0]?.args[0]).toEqual({
      amount: 120,
      occurred_on: "2026-01-05",
      description: null,
      notes: null,
      interest_rate: 2,
    });
    expect(supabase.callsOn("loans", "update")[0]?.args[0]).toEqual({
      amount: 120,
      loaned_on: "2026-01-05",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/loans");
  });

  it("rechaza una fecha posterior a alguna devolución", async () => {
    supabase.queue("loan_disbursements", {
      data: { loan_id: LOAN_ID },
      error: null,
    });
    supabase.queue("loan_payments", {
      data: [
        {
          id: PAYMENT_ID,
          disbursement_id: DISBURSEMENT_ID,
          amount: 20,
          occurred_on: "2026-01-01",
        },
      ],
      error: null,
    });

    await expect(
      updateLoanDisbursement(DISBURSEMENT_ID, {
        ...validDisbursement,
        occurredOn: "2026-01-10",
      }),
    ).rejects.toThrow("El préstamo no puede ser posterior a sus devoluciones.");

    expect(supabase.callsOn("loan_disbursements", "update")).toHaveLength(0);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rechaza cambios que dejarían devoluciones mayores al préstamo", async () => {
    supabase.queue("loan_disbursements", {
      data: { loan_id: LOAN_ID },
      error: null,
    });
    supabase.queue("loan_payments", {
      data: [
        {
          id: PAYMENT_ID,
          disbursement_id: DISBURSEMENT_ID,
          amount: 50,
          occurred_on: "2026-01-20",
        },
      ],
      error: null,
    });

    await expect(
      updateLoanDisbursement(DISBURSEMENT_ID, {
        ...validDisbursement,
        amount: 10,
        occurredOn: "2026-01-10",
      }),
    ).rejects.toThrow("Los cambios dejarían devoluciones mayores al préstamo.");

    expect(supabase.callsOn("loan_disbursements", "update")).toHaveLength(0);
  });

  it("propaga el error cuando el desembolso no existe", async () => {
    supabase.queue("loan_disbursements", { data: null, error: null });

    await expect(
      updateLoanDisbursement(DISBURSEMENT_ID, validDisbursement),
    ).rejects.toThrow("Préstamo no encontrado.");
  });
});

describe("deleteLoanDisbursement", () => {
  it("rechaza cuando no hay usuario autenticado", async () => {
    supabase.setUser(null);

    await expect(deleteLoanDisbursement(DISBURSEMENT_ID)).rejects.toThrow(
      "Debes iniciar sesión.",
    );
  });

  it("rechaza un id inválido con el mensaje de zod", async () => {
    await expect(deleteLoanDisbursement("no-es-uuid")).rejects.toThrow(
      "Selecciona un préstamo válido.",
    );
  });

  it("elimina el desembolso, sincroniza totales y revalida /loans", async () => {
    supabase.queue("loan_disbursements", {
      data: { loan_id: LOAN_ID },
      error: null,
    });
    supabase.queue("loan_payments", { count: 0, error: null });
    supabase.queue("loan_disbursements", { count: 2, error: null });
    supabase.queue("loan_disbursements", { error: null });
    supabase.queue("loan_disbursements", {
      data: [{ amount: 80, occurred_on: "2026-01-02" }],
      error: null,
    });
    supabase.queue("loans", { error: null });

    await expect(
      deleteLoanDisbursement(DISBURSEMENT_ID),
    ).resolves.toBeUndefined();

    expect(supabase.callsOn("loan_disbursements", "delete")).toHaveLength(1);
    expect(supabase.callsOn("loans", "update")[0]?.args[0]).toEqual({
      amount: 80,
      loaned_on: "2026-01-02",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/loans");
  });

  it("rechaza eliminar un desembolso con devoluciones registradas", async () => {
    supabase.queue("loan_disbursements", {
      data: { loan_id: LOAN_ID },
      error: null,
    });
    supabase.queue("loan_payments", { count: 1, error: null });

    await expect(deleteLoanDisbursement(DISBURSEMENT_ID)).rejects.toThrow(
      "No se puede eliminar un préstamo con devoluciones registradas.",
    );

    expect(supabase.callsOn("loan_disbursements", "delete")).toHaveLength(0);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rechaza eliminar el único desembolso del saldo", async () => {
    supabase.queue("loan_disbursements", {
      data: { loan_id: LOAN_ID },
      error: null,
    });
    supabase.queue("loan_payments", { count: 0, error: null });
    supabase.queue("loan_disbursements", { count: 1, error: null });

    await expect(deleteLoanDisbursement(DISBURSEMENT_ID)).rejects.toThrow(
      "No se puede eliminar el único préstamo de este saldo. Elimina la cuenta.",
    );

    expect(supabase.callsOn("loan_disbursements", "delete")).toHaveLength(0);
  });

  it("propaga el error cuando el desembolso no existe", async () => {
    supabase.queue("loan_disbursements", { data: null, error: null });

    await expect(deleteLoanDisbursement(DISBURSEMENT_ID)).rejects.toThrow(
      "Préstamo no encontrado.",
    );
  });
});
