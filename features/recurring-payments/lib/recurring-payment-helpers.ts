import { format } from "date-fns"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"

export function isRelevantForMonth(payment: RecurringPayment, monthKey: string) {
  if (payment.frequency === "monthly") return true
  return payment.nextDueOn.startsWith(monthKey) || payment.paidOn?.startsWith(monthKey)
}

export function formatFrequency(payment: RecurringPayment) {
  if (payment.frequency === "monthly") return "Mensual"
  if (payment.frequency === "yearly") return "Anual"
  return `Cada ${payment.intervalMonths} meses`
}

export function daysUntilDue(nextDueOn: string, todayStr = format(new Date(), "yyyy-MM-dd")) {
  return Math.round(
    (new Date(`${nextDueOn}T12:00:00`).getTime() - new Date(`${todayStr}T12:00:00`).getTime()) /
      (1000 * 60 * 60 * 24)
  )
}

export function daysLabel(nextDueOn: string, todayStr = format(new Date(), "yyyy-MM-dd")) {
  const days = daysUntilDue(nextDueOn, todayStr)
  if (days === 0) return "vence hoy"
  if (days === 1) return "vence mañana"
  return `vence en ${days} días`
}

export function getPaymentBadge(payment: RecurringPayment, monthKey: string) {
  if (!payment.isActive) {
    return {
      label: "Pausado",
      variant: "secondary" as const,
      className: "bg-muted text-muted-foreground",
    }
  }
  if (payment.paidOn) {
    return {
      label: payment.type === "income" ? "Cobrado" : "Pagado",
      variant: "secondary" as const,
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    }
  }
  if (!isRelevantForMonth(payment, monthKey)) {
    return {
      label: "Próximo",
      variant: "outline" as const,
      className: "text-muted-foreground",
    }
  }

  const days = daysUntilDue(payment.nextDueOn)

  if (days < 0) {
    return {
      label: payment.type === "income" ? "No cobrado" : "Vencido",
      variant: "destructive" as const,
      className: undefined,
    }
  }
  if (days <= 7) {
    return {
      label: payment.type === "income" ? "Próximo cobro" : "Vence pronto",
      variant: "secondary" as const,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    }
  }
  return {
    label: "Pendiente",
    variant: "secondary" as const,
    className: undefined,
  }
}
