import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { SummaryCard } from "@/components/summary-card"
import { formatCurrency } from "@/lib/format"

type DashboardSummaryCardsProps = {
  isLoading: boolean
  hasPlan: boolean
  availableForVariable: number
  savings: number
  recurringEstimated: number
  recurringPaymentCount: number
  availableAfterSavings: number
  variableSpent: number
  usage: number
  dailyAvailable: number
  remaining: number
  daysRemaining: number
}

export function DashboardSummaryCards({
  isLoading,
  hasPlan,
  availableForVariable,
  savings,
  recurringEstimated,
  recurringPaymentCount,
  availableAfterSavings,
  variableSpent,
  usage,
  dailyAvailable,
  remaining,
  daysRemaining,
}: DashboardSummaryCardsProps) {
  const summaryCards = [
    {
      title: "Disponible libre",
      value: formatCurrency(availableForVariable),
      description: hasPlan
        ? "Después de ahorro y pagos recurrentes"
        : "Configura tu plan para mayor precisión",
      icon: WalletCardsIcon,
      positive: remaining >= 0,
    },
    {
      title: "Ahorro obligatorio",
      value: formatCurrency(savings),
      description: hasPlan ? "Dinero que no debes tocar" : "Sin plan mensual",
      icon: ArrowUpIcon,
      positive: true,
    },
    {
      title: "Pagos recurrentes",
      value: formatCurrency(recurringEstimated),
      description: `${recurringPaymentCount} pago${recurringPaymentCount !== 1 ? "s" : ""} estimado${recurringPaymentCount !== 1 ? "s" : ""} este mes`,
      icon: ArrowDownIcon,
      positive: recurringEstimated <= availableAfterSavings,
    },
    {
      title: "Gastos variables",
      value: formatCurrency(variableSpent),
      description: `${usage}% de tu disponible libre`,
      icon: TrendingUpIcon,
      positive: usage < 85,
    },
    {
      title: "Gasto diario disponible",
      value: formatCurrency(dailyAvailable),
      description: `S/ ${remaining.toFixed(0)} libres · ${daysRemaining} día${daysRemaining !== 1 ? "s" : ""} restantes`,
      icon: CalendarDaysIcon,
      positive: remaining >= 0,
    },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {isLoading
        ? Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-lg border p-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-7 w-28" />
              <Skeleton className="mt-2 h-3 w-full max-w-40" />
            </div>
          ))
        : summaryCards.map((card) => (
            <SummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              description={card.description}
              icon={card.icon}
              variant={card.positive ? "default" : "negative"}
            />
          ))}
    </section>
  )
}
