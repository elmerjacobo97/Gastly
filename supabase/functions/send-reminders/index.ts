import { createClient } from "@supabase/supabase-js";
import { addDays, dateInTimeZone } from "../_shared/date.ts";
import { hasValidWebhookSecret } from "../_shared/webhook-auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const REMINDERS_WEBHOOK_SECRET = Deno.env.get("REMINDERS_WEBHOOK_SECRET");
const FROM_EMAIL = "Gastly <noreply@elmerjacobo.dev>";
const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "long",
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type DuePayment = {
  user_id: string;
  email: string;
  full_name: string | null;
  description: string;
  amount: number;
  currency: string;
  next_due_on: string;
  days_until: number;
};

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function formatTotals(payments: DuePayment[]) {
  const totals = new Map<string, number>();
  for (const payment of payments) {
    totals.set(
      payment.currency,
      (totals.get(payment.currency) ?? 0) + payment.amount,
    );
  }
  return Array.from(totals, ([currency, amount]) =>
    formatCurrency(amount, currency),
  ).join(" · ");
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

function buildEmail(displayName: string, payments: DuePayment[]) {
  const rows = payments
    .map((p) => {
      const label =
        p.days_until === 0
          ? '<strong style="color:#d97706">Hoy</strong>'
          : p.days_until === 1
            ? '<strong style="color:#d97706">Mañana</strong>'
            : `En ${p.days_until} días`;
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #dedede;font-size:14px;line-height:24px;color:#24292e">${escapeHtml(p.description)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #dedede;font-size:14px;line-height:24px;color:#6a737d">${label} · ${formatDate(p.next_due_on)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #dedede;font-size:14px;line-height:24px;font-weight:600;text-align:right;color:#24292e">${formatCurrency(p.amount, p.currency)}</td>
        </tr>`;
    })
    .join("");

  const total = formatTotals(payments);
  const count = payments.length;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="es">
<head>
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <meta name="x-apple-disable-message-reformatting" />
</head>
<body style="background-color:rgb(255,255,255)">
  <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
    <tbody>
      <tr>
        <td style='background-color:rgb(255,255,255);color:rgb(36,41,46);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif'>
          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;margin-right:auto;margin-left:auto;">
            <tbody>
              <tr style="width:100%">
                <td style="padding-top:20px;padding-bottom:48px;padding-right:0;padding-left:0">

                  <!-- Logo -->
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tbody>
                      <tr>
                        <td style="background-color:#1d42d0;border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:18px;font-weight:700;line-height:32px;display:block;">G</span>
                        </td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <span style="font-size:18px;font-weight:700;color:#111827;">Gastly</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p style="font-size:24px;line-height:1.25;margin-top:16px;margin-bottom:16px">
                    <strong>Pagos próximos</strong>
                  </p>

                  <!-- Card -->
                  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="padding:24px;border-style:solid;border-width:1px;border-color:rgb(222,222,222);border-radius:8px;">
                    <tbody>
                      <tr>
                        <td>
                          <p style="font-size:14px;line-height:24px;margin-bottom:16px;margin-top:0;">
                            Hola, <strong>${escapeHtml(displayName)}</strong>. Tienes ${count === 1 ? "un pago" : `${count} pagos`} próximo${count !== 1 ? "s" : ""} en los próximos días:
                          </p>

                          <!-- Payments table -->
                          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
                            <tbody>${rows}
                              <tr>
                                <td colspan="2" style="padding-top:12px;font-size:14px;font-weight:600;color:#24292e">Total estimado</td>
                                <td style="padding-top:12px;font-size:14px;font-weight:700;color:#24292e;text-align:right">${total}</td>
                              </tr>
                            </tbody>
                          </table>

                          <!-- CTA -->
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                            <tbody>
                              <tr>
                                <td style="background-color:#1d42d0;border-radius:8px;">
                                  <a href="https://gastly.elmerjacobo.dev/recurring-payments"
                                     style="text-decoration:none;display:inline-block;font-size:14px;font-weight:600;color:rgb(255,255,255);padding:12px 24px;"
                                     target="_blank">
                                    Ver pagos recurrentes
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          <p style="font-size:12px;line-height:20px;color:rgb(106,115,125);margin-top:20px;margin-bottom:0;">
                            Recibes este recordatorio porque tienes pagos próximos en los próximos 3 días.
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Footer -->
                  <p style="font-size:12px;line-height:24px;color:rgb(106,115,125);text-align:center;margin-top:40px;margin-bottom:0;">
                    Gastly · Finanzas personales
                  </p>

                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}

function buildOverdueEmail(displayName: string, payments: DuePayment[]) {
  const rows = payments
    .map(
      (p) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #dedede;font-size:14px;line-height:24px;color:#24292e">${escapeHtml(p.description)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #dedede;font-size:14px;line-height:24px;color:#dc2626"><strong>Venció ayer</strong> · ${formatDate(p.next_due_on)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #dedede;font-size:14px;line-height:24px;font-weight:600;text-align:right;color:#24292e">${formatCurrency(p.amount, p.currency)}</td>
      </tr>`,
    )
    .join("");

  const total = formatTotals(payments);
  const count = payments.length;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="es">
<head>
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <meta name="x-apple-disable-message-reformatting" />
</head>
<body style="background-color:rgb(255,255,255)">
  <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
    <tbody>
      <tr>
        <td style='background-color:rgb(255,255,255);color:rgb(36,41,46);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif'>
          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;margin-right:auto;margin-left:auto;">
            <tbody>
              <tr style="width:100%">
                <td style="padding-top:20px;padding-bottom:48px;padding-right:0;padding-left:0">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tbody>
                      <tr>
                        <td style="background-color:#1d42d0;border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:18px;font-weight:700;line-height:32px;display:block;">G</span>
                        </td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <span style="font-size:18px;font-weight:700;color:#111827;">Gastly</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p style="font-size:24px;line-height:1.25;margin-top:16px;margin-bottom:16px">
                    <strong>Pagos vencidos</strong>
                  </p>
                  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="padding:24px;border-style:solid;border-width:1px;border-color:rgb(222,222,222);border-radius:8px;">
                    <tbody>
                      <tr>
                        <td>
                          <p style="font-size:14px;line-height:24px;margin-bottom:16px;margin-top:0;">
                            Hola, <strong>${escapeHtml(displayName)}</strong>. ${count === 1 ? "Este pago venció" : `Estos ${count} pagos vencieron`} ayer y aún no se han registrado:
                          </p>
                          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
                            <tbody>${rows}
                              <tr>
                                <td colspan="2" style="padding-top:12px;font-size:14px;font-weight:600;color:#24292e">Total</td>
                                <td style="padding-top:12px;font-size:14px;font-weight:700;color:#24292e;text-align:right">${total}</td>
                              </tr>
                            </tbody>
                          </table>
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                            <tbody>
                              <tr>
                                <td style="background-color:#dc2626;border-radius:8px;">
                                  <a href="https://gastly.elmerjacobo.dev/recurring-payments"
                                     style="text-decoration:none;display:inline-block;font-size:14px;font-weight:600;color:rgb(255,255,255);padding:12px 24px;"
                                     target="_blank">
                                    Registrar pago
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <p style="font-size:12px;line-height:20px;color:rgb(106,115,125);margin-top:20px;margin-bottom:0;">
                            Puedes registrar el pago directamente desde la app.
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p style="font-size:12px;line-height:24px;color:rgb(106,115,125);text-align:center;margin-top:40px;margin-bottom:0;">
                    Gastly · Finanzas personales
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}

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
