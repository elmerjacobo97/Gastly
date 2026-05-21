"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PiggyBankIcon, WalletCardsIcon } from "lucide-react"
import { useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MonthlyPlanDialog } from "@/features/monthly-plan/components/monthly-plan-dialog"
import {
  calculateSavings,
  getMonthlyPlan,
} from "@/features/monthly-plan/lib/monthly-plan-api"
import { MonthNav } from "@/components/month-nav"
import { formatCurrency } from "@/features/transactions/lib/format-transaction"

export function MonthlyPlanPanel() {
  const [month, setMonth] = useState(() => new Date())
  const monthKey = month.toISOString().slice(0, 7)
  const monthLabel = format(month, "MMMM yyyy", { locale: es })

  const query = useQuery({
    queryKey: ["monthly-plan", monthKey],
    queryFn: () => getMonthlyPlan(month),
  })

  const plan = query.data ?? null
  const savings = calculateSavings(plan)
  const availableAfterSavings = plan ? Math.max(plan.expectedIncome - savings, 0) : 0

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Plan mensual
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define cuánto entra y cuánto debes separar antes de gastar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav value={month} onChange={setMonth} allowFuture />
          <MonthlyPlanDialog month={month} plan={plan} />
        </div>
      </section>

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-7 w-28" />
            </Card>
          ))}
        </div>
      ) : plan ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Ingreso estimado</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatCurrency(plan.expectedIncome)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Ahorro obligatorio</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(savings)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Después de ahorrar</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatCurrency(availableAfterSavings)}
              </p>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base capitalize">{monthLabel}</CardTitle>
              <CardDescription>
                {plan.savingsMode === "percent"
                  ? `Separas ${plan.savingsValue}% de tus ingresos.`
                  : `Separas ${formatCurrency(plan.savingsValue)} como monto fijo.`}
              </CardDescription>
            </CardHeader>
            {plan.notes && (
              <CardContent>
                <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                  {plan.notes}
                </p>
              </CardContent>
            )}
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <PiggyBankIcon className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Configura tu plan de este mes</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Sin plan, el resumen no puede calcular tu dinero realmente disponible.
              </p>
            </div>
            <MonthlyPlanDialog
              month={month}
              triggerLabel="Crear plan mensual"
              trigger={undefined}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
            <WalletCardsIcon className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">Cómo se usa este plan</CardTitle>
            <CardDescription>
              El resumen resta tu ahorro obligatorio y tus pagos recurrentes estimados antes de medir tus gastos.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </main>
  )
}
