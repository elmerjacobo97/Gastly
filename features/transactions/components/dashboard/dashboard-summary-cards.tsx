import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {isLoading
        ? Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-2 h-8 w-28" />
                </div>
                <Skeleton className="size-10 rounded-xl" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full max-w-40" />
              </CardContent>
            </Card>
          ))
        : summaryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <div>
                  <CardDescription className="text-xs">{card.title}</CardDescription>
                  <CardTitle className={`mt-1.5 text-2xl ${card.positive ? "text-foreground" : "text-destructive"}`}>
                    {card.value}
                  </CardTitle>
                </div>
                <div className={`grid size-10 place-items-center rounded-xl ${card.positive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                  <card.icon className="size-5" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
    </section>
  )
}
