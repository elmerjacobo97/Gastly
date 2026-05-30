"use client"

import { CircleAlertIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateMonthlyPlanDialog } from "@/features/monthly-plan/components/create-monthly-plan-dialog"
import { EditMonthlyPlanDialog } from "@/features/monthly-plan/components/edit-monthly-plan-dialog"
import { type MonthlyPlan } from "@/features/monthly-plan/types/monthly-plan-types"
import { formatCurrency } from "@/lib/format"

type MonthlyPlanSummaryCardProps = {
  date: Date
  plan: MonthlyPlan | null
  isLoading: boolean
  actualIncome: number
  savings: number
  availableAfterSavings: number
}

export function MonthlyPlanSummaryCard({
  date,
  plan,
  isLoading,
  actualIncome,
  savings,
  availableAfterSavings,
}: MonthlyPlanSummaryCardProps) {
  return (
    <Card className={!plan && !isLoading ? "border-amber-500/30 bg-amber-500/10" : undefined}>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-base">Plan del mes</CardTitle>
          <CardDescription>
            {plan
              ? "Ingreso real, ahorro obligatorio y disponible libre."
              : "Configura tu meta de ahorro para que el resumen sea preciso."}
          </CardDescription>
        </div>
        {!isLoading && (
          plan ? (
            <EditMonthlyPlanDialog month={date} plan={plan} />
          ) : (
            <CreateMonthlyPlanDialog month={date} />
          )
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border p-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-6 w-28" />
              </div>
            ))}
          </div>
        ) : plan ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Ingreso real del mes</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatCurrency(actualIncome)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Ahorro obligatorio</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(savings)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Después de ahorrar</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatCurrency(availableAfterSavings)}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {plan.savingsMode === "percent"
                ? `Separas ${plan.savingsValue}% de tus ingresos.`
                : `Separas ${formatCurrency(plan.savingsValue)} como monto fijo.`}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <CircleAlertIcon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>
              Sin plan mensual, el dashboard usa solo tus transacciones registradas y puede mostrar un disponible menos preciso.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
