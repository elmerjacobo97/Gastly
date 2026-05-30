import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
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
      description: hasPlan ? "Tras ahorro y recurrentes" : "Sin plan configurado",
      icon: WalletCardsIcon,
      positive: remaining >= 0,
    },
    {
      title: "Ahorro",
      value: formatCurrency(savings),
      description: hasPlan ? "No tocar" : "Sin plan mensual",
      icon: ArrowUpIcon,
      positive: true,
    },
    {
      title: "Recurrentes",
      value: formatCurrency(recurringEstimated),
      description: `${recurringPaymentCount} pago${recurringPaymentCount !== 1 ? "s" : ""} este mes`,
      icon: ArrowDownIcon,
      positive: recurringEstimated <= availableAfterSavings,
    },
    {
      title: "Variables",
      value: formatCurrency(variableSpent),
      description: `${usage}% del disponible`,
      icon: TrendingUpIcon,
      positive: usage < 85,
    },
    {
      title: "Gasto diario",
      value: formatCurrency(dailyAvailable),
      description: `${daysRemaining} día${daysRemaining !== 1 ? "s" : ""} restantes`,
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
        : summaryCards.map((card) => {
            const Icon = card.icon
            const isPositive = card.positive
            return (
              <div key={card.title} className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
                <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${isPositive ? "bg-muted/50 text-muted-foreground" : "bg-destructive/10 text-destructive"}`}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-muted-foreground">{card.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{card.description}</p>
                </div>
                <p className={`shrink-0 text-lg font-semibold tabular-nums ${isPositive ? "text-foreground" : "text-destructive"}`}>
                  {card.value}
                </p>
              </div>
            )
          })}
    </section>
  )
}
