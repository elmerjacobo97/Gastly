import {
  escapeHtml,
  formatCurrency,
  formatDate,
  formatTotals,
} from "./format.ts";
import type { DuePayment } from "./types.ts";

// ponytail: base URL from secret; falls back to prod. Set APP_URL per environment.
const APP_URL = (
  Deno.env.get("APP_URL") ?? "https://gastly.elmerjacobo.dev"
).replace(/\/$/, "");
const RECURRING_PAYMENTS_URL = `${APP_URL}/recurring-payments`;
// Light theme tokens from apps/web/app/globals.css (email clients ignore CSS variables).
const EMAIL_COLORS = {
  background: "#f7f7f2",
  card: "#ffffff",
  foreground: "#050505",
  mutedForeground: "#55554f",
  border: "#d6d6ce",
  primary: "#536b00",
  primaryForeground: "#f7f7f2",
  destructive: "#ff4a1c",
} as const;

type EmailRow = { description: string; detail: string; amount: string };

type EmailLayout = {
  title: string;
  intro: string;
  rows: EmailRow[];
  totalLabel: string;
  total: string;
  ctaLabel: string;
  ctaColor: string;
  ctaClass: string;
  note: string;
};

// Dark tokens from `.dark` in globals.css; applied via prefers-color-scheme.
const EMAIL_DARK_STYLES = `
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  @media (prefers-color-scheme: dark) {
    .bg-page { background-color: #050505 !important; }
    .bg-card { background-color: #161616 !important; border-color: #242424 !important; }
    .text-fg { color: #f7f7f2 !important; }
    .text-muted { color: #8a8a82 !important; }
    .line { border-color: #242424 !important; }
    .cta-primary { background-color: #d4ff3f !important; }
    .cta-primary a { color: #050505 !important; }
    .logo { background-color: #d4ff3f !important; }
    .logo span { color: #050505 !important; }
  }`;

function renderRow({ description, detail, amount }: EmailRow) {
  return `
    <tr>
      <td class="line" style="padding:12px 0;border-bottom:1px solid ${EMAIL_COLORS.border};">
        <div class="text-fg" style="font-size:14px;line-height:20px;font-weight:600;color:${EMAIL_COLORS.foreground};">${escapeHtml(description)}</div>
        <div class="text-muted" style="font-size:13px;line-height:20px;color:${EMAIL_COLORS.mutedForeground};">${detail}</div>
      </td>
      <td class="line text-fg" align="right" valign="top" style="padding:12px 0 12px 16px;border-bottom:1px solid ${EMAIL_COLORS.border};font-size:14px;line-height:20px;font-weight:600;white-space:nowrap;color:${EMAIL_COLORS.foreground};">${amount}</td>
    </tr>`;
}

function renderEmail(layout: EmailLayout) {
  return `<!DOCTYPE html>
<html dir="ltr" lang="es">
<head>
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <meta name="x-apple-disable-message-reformatting" />
  <style>${EMAIL_DARK_STYLES}</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:${EMAIL_COLORS.background};">
  <table class="bg-page" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${EMAIL_COLORS.background};">
    <tr>
      <td align="center" style="padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;">
          <tr>
            <td style="padding-bottom:20px;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td class="logo" width="32" height="32" align="center" valign="middle" bgcolor="${EMAIL_COLORS.primary}" style="width:32px;height:32px;border-radius:6px;background-color:${EMAIL_COLORS.primary};">
                    <span style="font-size:16px;font-weight:700;line-height:32px;color:${EMAIL_COLORS.primaryForeground};">G</span>
                  </td>
                  <td class="text-fg" style="padding-left:10px;font-size:18px;font-weight:700;color:${EMAIL_COLORS.foreground};">Gastly</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="bg-card" style="padding:24px;background-color:${EMAIL_COLORS.card};border:1px solid ${EMAIL_COLORS.border};border-radius:8px;">
              <h1 class="text-fg" style="margin:0 0 8px;font-size:20px;line-height:28px;color:${EMAIL_COLORS.foreground};">${layout.title}</h1>
              <p class="text-muted" style="margin:0 0 12px;font-size:14px;line-height:22px;color:${EMAIL_COLORS.mutedForeground};">${layout.intro}</p>
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
                ${layout.rows.map(renderRow).join("")}
                <tr>
                  <td class="text-fg" style="padding-top:14px;font-size:14px;font-weight:600;color:${EMAIL_COLORS.foreground};">${layout.totalLabel}</td>
                  <td class="text-fg" align="right" style="padding-top:14px;padding-left:16px;font-size:16px;font-weight:700;white-space:nowrap;color:${EMAIL_COLORS.foreground};">${layout.total}</td>
                </tr>
              </table>
              <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td class="${layout.ctaClass}" bgcolor="${layout.ctaColor}" style="background-color:${layout.ctaColor};border-radius:6px;">
                    <a href="${RECURRING_PAYMENTS_URL}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;text-decoration:none;color:${EMAIL_COLORS.primaryForeground};">${layout.ctaLabel}</a>
                  </td>
                </tr>
              </table>
              <p class="text-muted" style="margin:20px 0 0;font-size:12px;line-height:20px;color:${EMAIL_COLORS.mutedForeground};">${layout.note}</p>
            </td>
          </tr>
          <tr>
            <td class="text-muted" align="center" style="padding-top:24px;font-size:12px;color:${EMAIL_COLORS.mutedForeground};">Gastly · Finanzas personales</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildEmail(displayName: string, payments: DuePayment[]) {
  const count = payments.length;
  return renderEmail({
    title: "Pagos próximos",
    intro: `Hola, <strong>${escapeHtml(displayName)}</strong>. Tienes ${count === 1 ? "un pago próximo" : `${count} pagos próximos`}:`,
    rows: payments.map((p) => {
      const when =
        p.days_until === 0
          ? "Hoy"
          : p.days_until === 1
            ? "Mañana"
            : `En ${p.days_until} días`;
      return {
        description: p.description,
        detail: `${when} · ${formatDate(p.next_due_on)}`,
        amount: formatCurrency(p.amount, p.currency),
      };
    }),
    totalLabel: "Total estimado",
    total: formatTotals(payments),
    ctaLabel: "Ver pagos recurrentes",
    ctaColor: EMAIL_COLORS.primary,
    ctaClass: "cta-primary",
    note: "Recibes este recordatorio por tus pagos recurrentes activos.",
  });
}

export function buildOverdueEmail(displayName: string, payments: DuePayment[]) {
  const count = payments.length;
  return renderEmail({
    title: "Pagos vencidos",
    intro: `Hola, <strong>${escapeHtml(displayName)}</strong>. ${count === 1 ? "Este pago venció" : `Estos ${count} pagos vencieron`} ayer y aún no se ha registrado:`,
    rows: payments.map((p) => ({
      description: p.description,
      detail: `<span style="color:${EMAIL_COLORS.destructive};font-weight:600;">Venció ayer</span> · ${formatDate(p.next_due_on)}`,
      amount: formatCurrency(p.amount, p.currency),
    })),
    totalLabel: "Total",
    total: formatTotals(payments),
    ctaLabel: "Registrar pago",
    ctaColor: EMAIL_COLORS.destructive,
    ctaClass: "cta-danger",
    note: "Puedes registrar el pago directamente desde la app.",
  });
}
