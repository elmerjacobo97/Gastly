import { createClient } from "@supabase/supabase-js";
import { buildEmail, buildOverdueEmail } from "./email-template.ts";
import type { DuePayment } from "./types.ts";
import { addDays, dateInTimeZone } from "../_shared/date.ts";
import { hasValidWebhookSecret } from "../_shared/webhook-auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const REMINDERS_WEBHOOK_SECRET = Deno.env.get("REMINDERS_WEBHOOK_SECRET");
const FROM_EMAIL = "Gastly <noreply@elmerjacobo.dev>";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  idempotencyKey: string,
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

type PaymentRow = {
  user_id: string;
  description: string;
  amount: number;
  currency: string;
  next_due_on: string;
};

function groupByUser(rows: PaymentRow[]): Map<string, PaymentRow[]> {
  const map = new Map<string, PaymentRow[]>();
  for (const row of rows) {
    const existing = map.get(row.user_id) ?? [];
    existing.push(row);
    map.set(row.user_id, existing);
  }
  return map;
}

async function processAndSend(
  rows: PaymentRow[],
  daysUntil: number,
  runDate: string,
  subjectFn: (count: number, first: string) => string,
  emailFn: (name: string, payments: DuePayment[]) => string,
): Promise<number> {
  const byUser = groupByUser(rows);
  let sent = 0;

  for (const [userId, userPayments] of byUser) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user?.email) {
      console.error(`Could not fetch user ${userId}:`, userError?.message);
      continue;
    }

    const displayName =
      (user.user_metadata?.full_name as string | undefined) ||
      user.email.split("@")[0];
    const duePayments: DuePayment[] = userPayments.map((p) => ({
      user_id: userId,
      email: user.email!,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      description: p.description,
      amount: p.amount,
      currency: p.currency,
      next_due_on: p.next_due_on,
      days_until: daysUntil,
    }));

    const subject = subjectFn(duePayments.length, duePayments[0].description);

    try {
      await sendEmail(
        user.email,
        subject,
        emailFn(displayName, duePayments),
        `reminder-${runDate}-${daysUntil}-${userId}`,
      );
      console.log(`Sent to ${user.email}: ${subject}`);
      sent++;
    } catch (err) {
      console.error(`Failed to send to ${user.email}:`, err);
    }
  }

  return sent;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!REMINDERS_WEBHOOK_SECRET) {
    console.error("REMINDERS_WEBHOOK_SECRET is not configured");
    return new Response("Webhook not configured", { status: 503 });
  }
  if (
    !hasValidWebhookSecret(req, "x-reminders-secret", REMINDERS_WEBHOOK_SECRET)
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const todayStr = dateInTimeZone(new Date(), "America/Lima");
    const in3DaysStr = addDays(todayStr, 3);
    const yesterdayStr = addDays(todayStr, -1);

    // Query upcoming (hoy + 3) and overdue (ayer) in parallel
    const [upcomingRes, overdueRes] = await Promise.all([
      supabase
        .from("recurring_expenses")
        .select("user_id, description, amount, currency, next_due_on")
        .eq("is_active", true)
        .eq("next_due_on", in3DaysStr),
      supabase
        .from("recurring_expenses")
        .select("user_id, description, amount, currency, next_due_on")
        .eq("is_active", true)
        .eq("next_due_on", yesterdayStr),
    ]);

    if (upcomingRes.error)
      console.error("Upcoming query error:", upcomingRes.error.message);
    if (overdueRes.error)
      console.error("Overdue query error:", overdueRes.error.message);

    const [upcomingSent, overdueSent] = await Promise.all([
      upcomingRes.data?.length
        ? processAndSend(
            upcomingRes.data,
            3,
            todayStr,
            (n, first) =>
              n === 1
                ? `Recordatorio: ${first} vence en 3 días`
                : `Recordatorio: ${n} pagos próximos en 3 días`,
            buildEmail,
          )
        : Promise.resolve(0),
      overdueRes.data?.length
        ? processAndSend(
            overdueRes.data,
            -1,
            todayStr,
            (n, first) =>
              n === 1
                ? `⚠️ ${first} venció ayer`
                : `⚠️ ${n} pagos vencieron ayer`,
            buildOverdueEmail,
          )
        : Promise.resolve(0),
    ]);

    console.log(`Done. Upcoming: ${upcomingSent}, Overdue: ${overdueSent}`);
    return new Response(
      JSON.stringify({
        upcoming: upcomingSent,
        overdue: overdueSent,
        date: todayStr,
      }),
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
