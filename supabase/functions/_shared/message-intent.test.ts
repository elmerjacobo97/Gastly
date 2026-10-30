import { MAX_AMOUNT, MAX_ITEMS, parseMessage } from "./message-intent.ts";

const categories = { expense: ["Comida", "Transporte"], income: ["Sueldo"] };

function assertEquals(actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`Expected ${e}, got ${a}`);
}

const expense = (amount: unknown, category: unknown = "comida") => ({
  type: "expense",
  amount,
  description: "almuerzo",
  category,
});

Deno.test(
  "maps a valid expense and matches the category case-insensitively",
  () => {
    const result = parseMessage(
      { intent: "transactions", items: [expense(45)] },
      categories,
    );
    assertEquals(result, {
      intent: "transactions",
      items: [
        {
          type: "expense",
          amount: 45,
          description: "Almuerzo",
          category: "Comida",
        },
      ],
    });
  },
);

Deno.test("drops unknown categories instead of inventing them", () => {
  const result = parseMessage(
    { intent: "transactions", items: [expense(10, "Viajes")] },
    categories,
  );
  if (result.intent !== "transactions") throw new Error("Expected items");
  assertEquals(result.items[0].category, null);
});

Deno.test("asks for the amount when it is missing", () => {
  assertEquals(
    parseMessage(
      { intent: "transactions", items: [expense(null)] },
      categories,
    ),
    { intent: "missing_amount" },
  );
});

Deno.test("rejects nonsense amounts, too many items and bad shapes", () => {
  const unknown = { intent: "unknown" };
  for (const amount of [0, -5, MAX_AMOUNT + 1, "50", Infinity]) {
    assertEquals(
      parseMessage(
        { intent: "transactions", items: [expense(amount)] },
        categories,
      ),
      unknown,
    );
  }
  assertEquals(
    parseMessage(
      {
        intent: "transactions",
        items: Array.from({ length: MAX_ITEMS + 1 }, () => expense(1)),
      },
      categories,
    ),
    unknown,
  );
  assertEquals(
    parseMessage({ intent: "transactions", items: [] }, categories),
    unknown,
  );
  assertEquals(parseMessage("asdf", categories), unknown);
  assertEquals(parseMessage({ intent: "drop table" }, categories), unknown);
});

Deno.test("passes through read-only intents", () => {
  assertEquals(parseMessage({ intent: "balance", items: [] }, categories), {
    intent: "balance",
  });
});
