export const MAX_ITEMS = 5;
export const MAX_AMOUNT = 100_000;

export type ParsedItem = {
  type: "expense" | "income";
  amount: number;
  description: string;
  category: string | null;
};

export type ParsedMessage =
  | { intent: "transactions"; items: ParsedItem[] }
  | { intent: "balance" | "summary" | "payments" | "unknown" }
  | { intent: "missing_amount" };

export const MESSAGE_SCHEMA = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: ["transactions", "balance", "summary", "payments", "unknown"],
    },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["expense", "income"] },
          amount: { type: ["number", "null"] },
          description: { type: "string" },
          category: { type: ["string", "null"] },
        },
        required: ["type", "amount", "description", "category"],
        additionalProperties: false,
      },
    },
  },
  required: ["intent", "items"],
  additionalProperties: false,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function matchCategory(
  name: unknown,
  categoryNames: readonly string[],
): string | null {
  if (typeof name !== "string") return null;
  const lower = name.trim().toLowerCase();
  return categoryNames.find((c) => c.toLowerCase() === lower) ?? null;
}

function parseItem(
  raw: unknown,
  categoryNames: { expense: string[]; income: string[] },
): ParsedItem | "missing_amount" | null {
  if (!isRecord(raw)) return null;
  if (raw.type !== "expense" && raw.type !== "income") return null;

  if (raw.amount === null || raw.amount === undefined) return "missing_amount";
  if (
    typeof raw.amount !== "number" ||
    !Number.isFinite(raw.amount) ||
    raw.amount <= 0 ||
    raw.amount > MAX_AMOUNT
  ) {
    return null;
  }

  const description =
    typeof raw.description === "string" ? raw.description.trim() : "";

  return {
    type: raw.type,
    amount: Math.round(raw.amount * 100) / 100,
    description:
      capitalize(description.slice(0, 120)) ||
      (raw.type === "expense"
        ? "Gasto desde Telegram"
        : "Ingreso desde Telegram"),
    category: matchCategory(raw.category, categoryNames[raw.type]),
  };
}

// Never trust the model output: anything off-schema collapses to "unknown" so nothing is saved.
export function parseMessage(
  raw: unknown,
  categoryNames: { expense: string[]; income: string[] },
): ParsedMessage {
  if (!isRecord(raw)) return { intent: "unknown" };

  switch (raw.intent) {
    case "balance":
    case "summary":
    case "payments":
      return { intent: raw.intent };
    case "transactions":
      break;
    default:
      return { intent: "unknown" };
  }

  if (
    !Array.isArray(raw.items) ||
    raw.items.length === 0 ||
    raw.items.length > MAX_ITEMS
  ) {
    return { intent: "unknown" };
  }

  const items: ParsedItem[] = [];
  for (const rawItem of raw.items) {
    const item = parseItem(rawItem, categoryNames);
    if (item === "missing_amount") return { intent: "missing_amount" };
    if (item === null) return { intent: "unknown" };
    items.push(item);
  }

  return { intent: "transactions", items };
}
