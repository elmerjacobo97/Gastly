import {
  ArrowDownIcon,
  CreditCardIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react"

import { formatCurrency } from "@/lib/format"

type DashboardSummaryCardsProps = {
  availableForVariable: number
  totalToPay: number
  creditCardDebt: number
  availableAfterSavings: number
  variableSpent: number
  usage: number
  remaining: number
}

export function DashboardSummaryCards({
  availableForVariable,
  totalToPay,
  creditCardDebt,
  availableAfterSavings,
  variableSpent,
  usage,
  remaining,
}: DashboardSummaryCardsProps) {
  const summaryCards = [
    {
      title: "Disponible libre",
      value: formatCurrency(availableForVariable),
      description: "Lo que queda después de obligaciones",
      icon: WalletCardsIcon,
      positive: remaining >= 0,
    },
    {
      title: "Por pagar este mes",
      value: formatCurrency(totalToPay),
      description: "Recurrentes + cuotas",
      icon: ArrowDownIcon,
      positive: totalToPay <= availableAfterSavings,
    },
    {
      title: "Deuda de tarjeta",
      value: formatCurrency(creditCardDebt),
      description: creditCardDebt > 0 ? "Compras pendientes de pagar" : "Sin deuda pendiente",
      icon: CreditCardIcon,
      positive: creditCardDebt === 0,
    },
    {
      title: "Gastos variables",
      value: formatCurrency(variableSpent),
      description: `${usage}% del disponible`,
      icon: TrendingUpIcon,
      positive: usage < 85,
    },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {summaryCards.map((card) => {
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
