import { createClient } from "@supabase/supabase-js";
import {
  addDays,
  dateInTimeZone,
  daysBetween,
  monthRange,
} from "../_shared/date.ts";
import { hasValidWebhookSecret } from "../_shared/webhook-auth.ts";

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

  const [{ data: plan }, { data: transactions }] = await Promise.all([
    supabase
      .from("monthly_plans")
      .select("savings_mode, savings_value")
      .eq("user_id", userId)
      .eq("month", `${monthKey}-01`)
      .single(),
    supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", userId)
      .gte("occurred_on", start)
      .lt("occurred_on", endExclusive),
  ]);

  let actualIncome = 0;
  let totalExpenses = 0;
  for (const transaction of transactions ?? []) {
    if (transaction.type === "income") actualIncome += transaction.amount;
    if (transaction.type === "expense") totalExpenses += transaction.amount;
  }

  if (!plan) {
    await sendMessage(
      chatId,
      `📊 <b>Este mes</b>\nIngresos: ${formatCurrency(actualIncome)}\nGastos: ${formatCurrency(totalExpenses)}\nBalance: ${formatCurrency(actualIncome - totalExpenses)}\n\n<i>Crea tu plan mensual en Gastly para ver tu saldo disponible real.</i>`,
    );
    return;
  }

  const savings =
    plan.savings_mode === "percent"
      ? actualIncome * (plan.savings_value / 100)
      : plan.savings_value;
  const available = Math.max(actualIncome - savings - totalExpenses, 0);
  const savingsLabel =
    plan.savings_mode === "percent"
      ? `Ahorro (${plan.savings_value}%)`
      : "Ahorro (fijo)";

  await sendMessage(
    chatId,
    `📊 <b>Saldo disponible — ${monthKey}</b>\n\nIngresos reales: ${formatCurrency(actualIncome)}\n${savingsLabel}: ${formatCurrency(savings)}\nGastado: ${formatCurrency(totalExpenses)}\n\n<b>Disponible: ${formatCurrency(available)}</b>`,
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
      default:
        await sendMessage(
          chatId,
          "Comandos disponibles:\n\n/gaste &lt;monto&gt; &lt;descripción&gt;\n/ingreso &lt;monto&gt; &lt;descripción&gt;\n/saldo\n/pagos\n/resumen",
        );
    }
  } catch (e) {
    console.error(e);
  }

  return new Response("OK");
});
