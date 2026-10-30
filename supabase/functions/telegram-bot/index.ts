import { createClient } from "@supabase/supabase-js";
import {
  addDays,
  dateInTimeZone,
  daysBetween,
  monthRange,
} from "../_shared/date.ts";
import { classifyMessage } from "../_shared/groq.ts";
import { parseMessage } from "../_shared/message-intent.ts";
import { hasValidWebhookSecret } from "../_shared/webhook-auth.ts";

const HELP_TEXT =
  "Comandos disponibles:\n\n/gaste &lt;monto&gt; &lt;descripción&gt;\n/ingreso &lt;monto&gt; &lt;descripción&gt;\n/saldo\n/pagos\n/resumen\n/deshacer\n\nO escribe en lenguaje natural: <i>gasté 45 en almuerzo</i>";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function getUserByTelegramId(telegramUserId: number) {
  const { data } = await supabase
    .from("telegram_connections")
    .select("user_id")
    .eq("telegram_user_id", telegramUserId)
    .single();
  return data?.user_id ?? null;
}

function currentMonthRange(now = new Date()) {
  const today = dateInTimeZone(now, "America/Lima");
  return monthRange(today);
}

function formatCurrency(amount: number, currency = "PEN") {
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// /start <token> — link Telegram account to Gastly account
async function handleStart(
  chatId: number,
  telegramUserId: number,
  telegramUsername: string | undefined,
  args: string,
) {
  const token = args.trim();
  if (!token) {
    await sendMessage(
      chatId,
      "Para vincular tu cuenta, genera un código en <b>Gastly → Configuración → Telegram</b> y envíalo aquí con /start <código>",
    );
    return;
  }

  const { data: linkToken } = await supabase
    .from("telegram_link_tokens")
    .select("token, user_id, expires_at, used_at")
    .eq("token", token)
    .single();

  if (!linkToken) {
    await sendMessage(
      chatId,
      "❌ Código inválido. Genera uno nuevo en Gastly → Configuración → Telegram.",
    );
    return;
  }

  if (linkToken.used_at) {
    await sendMessage(chatId, "❌ Este código ya fue usado. Genera uno nuevo.");
    return;
  }

  if (new Date(linkToken.expires_at) < new Date()) {
    await sendMessage(
      chatId,
      "❌ Código expirado (válido 10 minutos). Genera uno nuevo.",
    );
    return;
  }

  // Check if already linked
  const { data: existing } = await supabase
    .from("telegram_connections")
    .select("id")
    .eq("user_id", linkToken.user_id)
    .single();

  if (existing) {
    await supabase
      .from("telegram_connections")
      .update({
        telegram_user_id: telegramUserId,
        telegram_username: telegramUsername ?? null,
      })
      .eq("user_id", linkToken.user_id);
  } else {
    await supabase.from("telegram_connections").insert({
      user_id: linkToken.user_id,
      telegram_user_id: telegramUserId,
      telegram_username: telegramUsername ?? null,
    });
  }

  await supabase
    .from("telegram_link_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);

  await sendMessage(
    chatId,
    "✅ <b>Cuenta vinculada correctamente.</b>\n\nComandos disponibles:\n/gaste &lt;monto&gt; &lt;descripción&gt;\n/ingreso &lt;monto&gt; &lt;descripción&gt;\n/saldo\n/pagos\n/resumen",
  );
}

// /gaste 50 almuerzo → register expense
async function handleGaste(chatId: number, userId: string, args: string) {
  const parts = args.trim().split(" ");
  const amount = Number(parts[0]);
  if (!Number.isFinite(amount) || amount <= 0) {
    await sendMessage(
      chatId,
      "❌ Formato: /gaste &lt;monto&gt; &lt;descripción&gt;\nEjemplo: /gaste 50 almuerzo",
    );
    return;
  }

  const description = parts.slice(1).join(" ").trim() || "Gasto desde Telegram";

  // Try to match description against user's expense categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId)
    .eq("type", "expense");

  let categoryId: string | null = null;
  if (categories && description) {
    const lower = description.toLowerCase();
    const match = categories.find((c) => lower.includes(c.name.toLowerCase()));
    if (match) categoryId = match.id;
  }

  const today = dateInTimeZone(new Date(), "America/Lima");
  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    type: "expense",
    source: "telegram",
    amount,
    description,
    category_id: categoryId,
    occurred_on: today,
  });

  if (error) {
    await sendMessage(chatId, `❌ Error al registrar: ${error.message}`);
    return;
  }

  const categoryName = categories?.find((c) => c.id === categoryId)?.name;
  const reply = categoryName
    ? `✅ Gasto registrado\n<b>${formatCurrency(amount)}</b> — ${description}\nCategoría: ${categoryName}`
    : `✅ Gasto registrado\n<b>${formatCurrency(amount)}</b> — ${description}\n<i>Sin categoría — asígnala en Gastly</i>`;

  await sendMessage(chatId, reply);
}

// /ingreso 2500 sueldo → register income
async function handleIngreso(chatId: number, userId: string, args: string) {
  const parts = args.trim().split(" ");
  const amount = Number(parts[0]);
  if (!Number.isFinite(amount) || amount <= 0) {
    await sendMessage(
      chatId,
      "❌ Formato: /ingreso &lt;monto&gt; &lt;descripción&gt;\nEjemplo: /ingreso 2500 sueldo",
    );
    return;
  }

  const description =
    parts.slice(1).join(" ").trim() || "Ingreso desde Telegram";

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId)
    .eq("type", "income");

  let categoryId: string | null = null;
  if (categories && description) {
    const lower = description.toLowerCase();
    const match = categories.find((c) => lower.includes(c.name.toLowerCase()));
    if (match) categoryId = match.id;
  }

  const today = dateInTimeZone(new Date(), "America/Lima");
  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    type: "income",
    source: "telegram",
    amount,
    description,
    category_id: categoryId,
    occurred_on: today,
  });

  if (error) {
    await sendMessage(chatId, `❌ Error al registrar: ${error.message}`);
    return;
  }

  await sendMessage(
    chatId,
    `✅ Ingreso registrado\n<b>${formatCurrency(amount)}</b> — ${description}`,
  );
}

// /saldo → available balance this month
async function handleSaldo(chatId: number, userId: string) {
  const { monthKey, start, endExclusive } = currentMonthRange();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", userId)
    .gte("occurred_on", start)
    .lt("occurred_on", endExclusive);

  let actualIncome = 0;
  let totalExpenses = 0;
  for (const transaction of transactions ?? []) {
    if (transaction.type === "income") actualIncome += transaction.amount;
    if (transaction.type === "expense") totalExpenses += transaction.amount;
  }

  const balance = actualIncome - totalExpenses;
  const available = Math.max(balance, 0);

  await sendMessage(
    chatId,
    `📊 <b>Saldo disponible — ${monthKey}</b>\n\nIngresos reales: ${formatCurrency(actualIncome)}\nGastado: ${formatCurrency(totalExpenses)}\nBalance: ${formatCurrency(balance)}\n\n<b>Disponible: ${formatCurrency(available)}</b>`,
  );
}

// /pagos → upcoming payments next 7 days
async function handlePagos(chatId: number, userId: string) {
  const todayStr = dateInTimeZone(new Date(), "America/Lima");
  const in7DaysStr = addDays(todayStr, 7);

  const { data: expenses } = await supabase
    .from("recurring_expenses")
    .select("description, amount, currency, next_due_on")
    .eq("user_id", userId)
    .eq("is_active", true)
    .gte("next_due_on", todayStr)
    .lte("next_due_on", in7DaysStr)
    .order("next_due_on", { ascending: true });

  if (!expenses || expenses.length === 0) {
    await sendMessage(
      chatId,
      "✅ Sin pagos pendientes en los próximos 7 días.",
    );
    return;
  }

  const lines = expenses.map((e) => {
    const diffDays = daysBetween(todayStr, e.next_due_on);
    const label =
      diffDays === 0
        ? "Hoy"
        : diffDays === 1
          ? "Mañana"
          : `En ${diffDays} días`;
    return `• ${label} — ${e.description}: <b>${formatCurrency(e.amount, e.currency)}</b>`;
  });

  await sendMessage(chatId, `📅 <b>Próximos pagos</b>\n\n${lines.join("\n")}`);
}

// /resumen → monthly summary
async function handleResumen(chatId: number, userId: string) {
  const { monthKey, start, endExclusive } = currentMonthRange();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("type, amount, category_id")
    .eq("user_id", userId)
    .gte("occurred_on", start)
    .lt("occurred_on", endExclusive);

  const income = (transactions ?? [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = (transactions ?? [])
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  const msg = `📈 <b>Resumen ${monthKey}</b>\n\nIngresos: ${formatCurrency(income)}\nGastos: ${formatCurrency(expenses)}\nBalance: <b>${formatCurrency(balance)}</b>`;

  await sendMessage(chatId, msg);
}

const UNDO_WINDOW_MS = 60 * 60 * 1000;

// /deshacer → delete the latest transaction created from Telegram in the last hour
async function handleDeshacer(chatId: number, userId: string) {
  const since = new Date(Date.now() - UNDO_WINDOW_MS).toISOString();
  const { data: last } = await supabase
    .from("transactions")
    .select("id, type, amount, description")
    .eq("user_id", userId)
    .eq("source", "telegram")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!last) {
    await sendMessage(
      chatId,
      "No hay movimientos del bot en la última hora para deshacer.",
    );
    return;
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", last.id)
    .eq("user_id", userId);

  if (error) {
    await sendMessage(chatId, `❌ Error al deshacer: ${error.message}`);
    return;
  }

  await sendMessage(
    chatId,
    `↩️ Eliminado: <b>${formatCurrency(last.amount)}</b> — ${escapeHtml(last.description)}`,
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Any non-command text → Groq classifies it → validated items are saved directly
async function handleFreeText(chatId: number, userId: string, text: string) {
  if (!GROQ_API_KEY) {
    await sendMessage(chatId, HELP_TEXT);
    return;
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", userId);

  const categoryNames = {
    expense: (categories ?? [])
      .filter((c) => c.type === "expense")
      .map((c) => c.name),
    income: (categories ?? [])
      .filter((c) => c.type === "income")
      .map((c) => c.name),
  };

  let parsed;
  try {
    parsed = parseMessage(
      await classifyMessage(text, categoryNames, GROQ_API_KEY),
      categoryNames,
    );
  } catch (e) {
    console.error(e);
    await sendMessage(
      chatId,
      "❌ No pude procesar tu mensaje. Intenta de nuevo.",
    );
    return;
  }

  switch (parsed.intent) {
    case "balance":
      return handleSaldo(chatId, userId);
    case "summary":
      return handleResumen(chatId, userId);
    case "payments":
      return handlePagos(chatId, userId);
    case "missing_amount":
      return sendMessage(chatId, "¿Cuánto fue el monto?");
    case "unknown":
      return sendMessage(
        chatId,
        `No entendí tu mensaje. Prueba: <i>gasté 45 en almuerzo</i>\n\n${HELP_TEXT}`,
      );
  }

  const today = dateInTimeZone(new Date(), "America/Lima");
  const rows = parsed.items.map((item) => ({
    user_id: userId,
    source: "telegram",
    type: item.type,
    amount: item.amount,
    description: item.description,
    category_id:
      categories?.find((c) => c.type === item.type && c.name === item.category)
        ?.id ?? null,
    occurred_on: today,
  }));

  const { error } = await supabase.from("transactions").insert(rows);
  if (error) {
    await sendMessage(chatId, `❌ Error al registrar: ${error.message}`);
    return;
  }

  const lines = parsed.items.map(
    (item) =>
      `<b>${formatCurrency(item.amount)}</b> — ${escapeHtml(item.description)}${item.category ? ` (${escapeHtml(item.category)})` : ""}`,
  );
  const title =
    parsed.items.length > 1
      ? `✅ ${parsed.items.length} movimientos registrados`
      : parsed.items[0].type === "expense"
        ? "✅ Gasto registrado"
        : "✅ Ingreso registrado";
  await sendMessage(chatId, `${title}\n${lines.join("\n")}`);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!TELEGRAM_WEBHOOK_SECRET) {
    console.error("TELEGRAM_WEBHOOK_SECRET is not configured");
    return new Response("Webhook not configured", { status: 503 });
  }
  if (
    !hasValidWebhookSecret(
      req,
      "x-telegram-bot-api-secret-token",
      TELEGRAM_WEBHOOK_SECRET,
    )
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const update = await req.json();
    const message = update.message;
    if (!message?.text || !message?.chat?.id || !message?.from?.id) {
      return new Response("OK");
    }

    const chatId: number = message.chat.id;
    const telegramUserId: number = message.from.id;
    const telegramUsername: string | undefined = message.from.username;
    const text: string = message.text.trim();

    const [command, ...argParts] = text.split(" ");
    const args = argParts.join(" ");

    if (command === "/start") {
      await handleStart(chatId, telegramUserId, telegramUsername, args);
      return new Response("OK");
    }

    const userId = await getUserByTelegramId(telegramUserId);
    if (!userId) {
      await sendMessage(
        chatId,
        "❌ Cuenta no vinculada. Ve a <b>Gastly → Configuración → Telegram</b> y genera un código de vinculación.",
      );
      return new Response("OK");
    }

    switch (command) {
      case "/gaste":
        await handleGaste(chatId, userId, args);
        break;
      case "/ingreso":
        await handleIngreso(chatId, userId, args);
        break;
      case "/saldo":
        await handleSaldo(chatId, userId);
        break;
      case "/pagos":
        await handlePagos(chatId, userId);
        break;
      case "/resumen":
        await handleResumen(chatId, userId);
        break;
      case "/deshacer":
        await handleDeshacer(chatId, userId);
        break;
      default:
        if (text.startsWith("/")) {
          await sendMessage(chatId, HELP_TEXT);
        } else {
          await handleFreeText(chatId, userId, text);
        }
    }
  } catch (e) {
    console.error(e);
  }

  return new Response("OK");
});
