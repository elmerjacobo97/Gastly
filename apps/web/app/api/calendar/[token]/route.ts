import { NextRequest, NextResponse } from "next/server";

import { decodeCalendarToken } from "@/lib/calendar-token";
import {
  dateInTimeZone,
  escapeIcsText,
  foldIcsLine,
  formatCurrency,
} from "@/lib/ics";
import { createAdminClient } from "@/lib/supabase/admin";

function icsDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function icsNow(): string {
  return new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

function valarm(trigger: string, description: string): string[] {
  return [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    foldIcsLine(`DESCRIPTION:${escapeIcsText(description)}`),
    `TRIGGER:${trigger}`,
    "END:VALARM",
  ];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token: rawToken } = await params;
  const token = rawToken.endsWith(".ics") ? rawToken.slice(0, -4) : rawToken;
  const userId = decodeCalendarToken(token);

  if (!userId) {
    return new NextResponse("Token inválido", { status: 401 });
  }

  const supabase = createAdminClient();
  const dtstamp = icsNow();
  const today = dateInTimeZone(new Date(), "America/Lima");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gastly//Finanzas Personales//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Gastly",
    "X-WR-TIMEZONE:America/Lima",
    "X-WR-CALDESC:Pagos recurrentes\\, cuotas y metas de Gastly",
  ];

  // Recurring expenses (active only)
  const { data: recurringExpenses, error: recurringError } = await supabase
    .from("recurring_expenses")
    .select("id, description, amount, currency, next_due_on")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (recurringError) {
    console.error(
      "Calendar feed recurring expenses query failed:",
      recurringError,
    );
    return new NextResponse("No se pudo generar el calendario", {
      status: 503,
    });
  }

  for (const expense of recurringExpenses ?? []) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:gastly-recurring-${expense.id}@gastly`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${icsDate(expense.next_due_on)}`,
      foldIcsLine(
        `SUMMARY:${escapeIcsText(expense.description)} - ${formatCurrency(expense.amount, expense.currency)}`,
      ),
      "DESCRIPTION:Pago recurrente",
      ...valarm("-P2D", "Pago recurrente próximo en Gastly"),
      "END:VEVENT",
    );
  }

  // Installment payments (pending + future)
  const { data: purchases, error: purchasesError } = await supabase
    .from("installment_purchases")
    .select("id, description, total_installments")
    .eq("user_id", userId);

  if (purchasesError) {
    console.error(
      "Calendar feed installment purchases query failed:",
      purchasesError,
    );
    return new NextResponse("No se pudo generar el calendario", {
      status: 503,
    });
  }

  if (purchases?.length) {
    const { data: payments, error: paymentsError } = await supabase
      .from("installment_payments")
      .select("id, purchase_id, payment_number, due_on, amount")
      .in(
        "purchase_id",
        purchases.map((p) => p.id),
      )
      .is("transaction_id", null)
      .eq("paid_externally", false)
      .gte("due_on", today);

    if (paymentsError) {
      console.error(
        "Calendar feed installment payments query failed:",
        paymentsError,
      );
      return new NextResponse("No se pudo generar el calendario", {
        status: 503,
      });
    }

    const purchaseMap = new Map(purchases.map((p) => [p.id, p]));

    for (const payment of payments ?? []) {
      const purchase = purchaseMap.get(payment.purchase_id);
      if (!purchase) continue;
      lines.push(
        "BEGIN:VEVENT",
        `UID:gastly-installment-${payment.id}@gastly`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${icsDate(payment.due_on)}`,
        foldIcsLine(
          `SUMMARY:${escapeIcsText(purchase.description)} - Cuota ${payment.payment_number}/${purchase.total_installments} - ${formatCurrency(payment.amount)}`,
        ),
        "DESCRIPTION:Cuota pendiente",
        ...valarm("-P1D", "Cuota pendiente en Gastly"),
        "END:VEVENT",
      );
    }
  }

  // Savings goals with target date (incomplete only)
  const { data: goals, error: goalsError } = await supabase
    .from("savings_goals")
    .select("id, name, target_amount, target_date, current_amount")
    .eq("user_id", userId)
    .not("target_date", "is", null);

  if (goalsError) {
    console.error("Calendar feed savings goals query failed:", goalsError);
    return new NextResponse("No se pudo generar el calendario", {
      status: 503,
    });
  }

  for (const goal of goals ?? []) {
    if (!goal.target_date) continue;
    if (Number(goal.current_amount) >= Number(goal.target_amount)) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:gastly-goal-${goal.id}@gastly`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${icsDate(goal.target_date)}`,
      foldIcsLine(
        `SUMMARY:Meta: ${escapeIcsText(goal.name)} - ${formatCurrency(goal.target_amount)}`,
      ),
      "DESCRIPTION:Meta de ahorro",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gastly.ics"',
      "Cache-Control": "no-cache, no-store",
    },
  });
}
