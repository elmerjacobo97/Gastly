import { NextRequest, NextResponse } from "next/server"

import { decodeCalendarToken } from "@/lib/calendar-token"
import { createAdminClient } from "@/lib/supabase/admin"

function esc(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n")
}

function icsDate(dateStr: string): string {
  return dateStr.replace(/-/g, "")
}

function icsNow(): string {
  return new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z"
}

function foldLine(line: string): string {
  const bytes = Buffer.from(line, "utf8")
  if (bytes.length <= 75) return line
  const parts: string[] = []
  let start = 0
  while (start < bytes.length) {
    const chunk = start === 0 ? 75 : 74
    parts.push(bytes.slice(start, start + chunk).toString("utf8"))
    start += chunk
  }
  return parts.join("\r\n ")
}

function valarm(trigger: string, description: string): string[] {
  return [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    foldLine(`DESCRIPTION:${esc(description)}`),
    `TRIGGER:${trigger}`,
    "END:VALARM",
  ]
}

function formatAmount(amount: number): string {
  return `S/ ${Number(amount).toFixed(2)}`
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: rawToken } = await params
  const token = rawToken.endsWith(".ics") ? rawToken.slice(0, -4) : rawToken
  const userId = decodeCalendarToken(token)

  if (!userId) {
    return new NextResponse("Token inválido", { status: 401 })
  }

  const supabase = createAdminClient()
  const dtstamp = icsNow()
  const today = new Date().toISOString().slice(0, 10)

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gastly//Finanzas Personales//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Gastly",
    "X-WR-TIMEZONE:America/Lima",
    "X-WR-CALDESC:Pagos recurrentes\\, cuotas y metas de Gastly",
  ]

  // Fixed expenses (active only)
  const { data: fixedExpenses } = await supabase
    .from("fixed_expenses")
    .select("id, description, amount, next_due_on")
    .eq("user_id", userId)
    .eq("is_active", true)

  for (const fe of fixedExpenses ?? []) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:gastly-fixed-${fe.id}@gastly`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${icsDate(fe.next_due_on)}`,
      foldLine(`SUMMARY:${esc(fe.description)} - ${formatAmount(fe.amount)}`),
      "DESCRIPTION:Pago recurrente",
      ...valarm("-P2D", "Pago recurrente próximo en Gastly"),
      "END:VEVENT",
    )
  }

  // Installment payments (pending + future)
  const { data: purchases } = await supabase
    .from("installment_purchases")
    .select("id, description, total_installments")
    .eq("user_id", userId)

  if (purchases?.length) {
    const { data: payments } = await supabase
      .from("installment_payments")
      .select("id, purchase_id, payment_number, due_on, amount")
      .in("purchase_id", purchases.map((p) => p.id))
      .is("transaction_id", null)
      .eq("paid_externally", false)
      .gte("due_on", today)

    const purchaseMap = new Map(purchases.map((p) => [p.id, p]))

    for (const payment of payments ?? []) {
      const purchase = purchaseMap.get(payment.purchase_id)
      if (!purchase) continue
      lines.push(
        "BEGIN:VEVENT",
        `UID:gastly-installment-${payment.id}@gastly`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${icsDate(payment.due_on)}`,
        foldLine(
          `SUMMARY:${esc(purchase.description)} - Cuota ${payment.payment_number}/${purchase.total_installments} - ${formatAmount(payment.amount)}`
        ),
        "DESCRIPTION:Cuota pendiente",
        ...valarm("-P1D", "Cuota pendiente en Gastly"),
        "END:VEVENT",
      )
    }
  }

  // Savings goals with target date (incomplete only)
  const { data: goals } = await supabase
    .from("savings_goals")
    .select("id, name, target_amount, target_date, current_amount")
    .eq("user_id", userId)
    .not("target_date", "is", null)

  for (const goal of goals ?? []) {
    if (!goal.target_date) continue
    if (Number(goal.current_amount) >= Number(goal.target_amount)) continue
    lines.push(
      "BEGIN:VEVENT",
      `UID:gastly-goal-${goal.id}@gastly`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${icsDate(goal.target_date)}`,
      foldLine(`SUMMARY:Meta: ${esc(goal.name)} - ${formatAmount(goal.target_amount)}`),
      "DESCRIPTION:Meta de ahorro",
      "END:VEVENT",
    )
  }

  lines.push("END:VCALENDAR")

  return new NextResponse(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gastly.ics"',
      "Cache-Control": "no-cache, no-store",
    },
  })
}
