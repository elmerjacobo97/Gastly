"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangleIcon, PiggyBankIcon, RefreshCwIcon, TrendingUpIcon, WalletCardsIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
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
import { calculateSavings } from "@/lib/finance/monthly-plan/lib/monthly-plan-api"
import { useMonthlyPlan } from "@/lib/finance/monthly-plan/hooks/queries"
import { MonthNav } from "@/components/month-nav"
import { CreateTransactionDialog } from "@/components/create-transaction-dialog"
import { useTransactions } from "@/lib/finance/transactions/hooks/queries"
import { formatCurrency } from "@/lib/format"

export function MonthlyPlanPanel() {
  const [month, setMonth] = useState(() => new Date())
  const monthLabel = format(month, "MMMM yyyy", { locale: es })

  const planQuery = useMonthlyPlan(month)
  const transactionsQuery = useTransactions({ month })

  const plan = planQuery.data ?? null
  const transactions = transactionsQuery.data ?? []
  const actualIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const savings = calculateSavings(plan, actualIncome)
  const availableAfterSavings = Math.max(actualIncome - savings, 0)

  const isLoading = planQuery.isLoading || transactionsQuery.isLoading

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Plan mensual
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define cuánto ahorrar. El ingreso y disponible se calculan desde tus transacciones reales.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav value={month} onChange={setMonth} allowFuture />
          {!isLoading && (
            plan ? (
              <EditMonthlyPlanDialog month={month} plan={plan} />
            ) : (
              <CreateMonthlyPlanDialog month={month} />
            )
          )}
        </div>
      </section>

      {planQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudo cargar el plan mensual</AlertTitle>
          <AlertDescription>
            {planQuery.error instanceof Error
              ? planQuery.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => planQuery.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {transactionsQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudieron cargar las transacciones</AlertTitle>
          <AlertDescription>
            {transactionsQuery.error instanceof Error
              ? transactionsQuery.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => transactionsQuery.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-3.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-2 h-7 w-32" />
              <Skeleton className="mt-2 h-3 w-36" />
            </Card>
          ))}
        </div>
      ) : plan ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Ingreso real del mes</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatCurrency(actualIncome)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {transactions.filter((t) => t.type === "income").length} transacción{transactions.filter((t) => t.type === "income").length !== 1 ? "es" : ""} de ingreso
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Ahorro obligatorio</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(savings)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {plan.savingsMode === "percent"
                  ? `${plan.savingsValue}% del ingreso`
                  : "Monto fijo"}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Después de ahorrar</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatCurrency(availableAfterSavings)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground capitalize">{monthLabel}</p>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base capitalize">{monthLabel}</CardTitle>
                <CardDescription>
                  {plan.savingsMode === "percent"
                    ? `Separas ${plan.savingsValue}% de cada ingreso que registres.`
                    : `Separas ${formatCurrency(plan.savingsValue)} como monto fijo al mes.`}
                </CardDescription>
              </div>
              <CreateTransactionDialog
                defaultType="income"
                lockType
                triggerLabel="Registrar ingreso"
                trigger={
                  <Button variant="outline">
                    <TrendingUpIcon data-icon="inline-start" />
                    <span>Registrar ingreso</span>
                  </Button>
                }
              />
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
      ) : !planQuery.isError && !transactionsQuery.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <PiggyBankIcon className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Configura tu plan de este mes</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Define tu meta de ahorro y el dashboard calculará tu disponible real automáticamente.
              </p>
            </div>
            <CreateMonthlyPlanDialog month={month} triggerLabel="Crear plan mensual" />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <WalletCardsIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">Cómo funciona el plan</CardTitle>
            <CardDescription>
              El ingreso disponible se calcula desde tus transacciones de ingreso reales. El plan define solo cuánto separas antes de gastar.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </main>
  )
}
