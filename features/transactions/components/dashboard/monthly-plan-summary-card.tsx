"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2Icon, CircleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MonthlyPlanDialog } from "@/features/monthly-plan/components/monthly-plan-dialog"
import { registerSalaryIncome } from "@/features/monthly-plan/lib/monthly-plan-api"
import { type MonthlyPlan } from "@/features/monthly-plan/types/monthly-plan-types"
import { formatCurrency } from "@/lib/format"

type MonthlyPlanSummaryCardProps = {
  date: Date
  plan: MonthlyPlan | null
  isLoading: boolean
  savings: number
  availableAfterSavings: number
}

export function MonthlyPlanSummaryCard({
  date,
  plan,
  isLoading,
  savings,
  availableAfterSavings,
}: MonthlyPlanSummaryCardProps) {
  const queryClient = useQueryClient()

  const salaryMutation = useMutation({
    mutationFn: () => registerSalaryIncome(plan!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["monthly-plan"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-totals"] }),
      ])
      toast.success("Sueldo registrado como ingreso")
    },
    onError: (error) => {
      toast.error("No se pudo registrar el sueldo", { description: error.message })
    },
  })

  return (
    <Card className={!plan && !isLoading ? "border-amber-500/30 bg-amber-500/10" : undefined}>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-base">Plan del mes</CardTitle>
          <CardDescription>
            {plan
              ? "Base para calcular ahorro, pagos recurrentes y disponible libre."
              : "Configura tu sueldo estimado y ahorro para que el resumen sea preciso."}
          </CardDescription>
        </div>
        {!isLoading && <MonthlyPlanDialog month={date} plan={plan} />}
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
                <p className="text-xs text-muted-foreground">Ingreso estimado</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatCurrency(plan.expectedIncome)}
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
            <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                {plan.savingsMode === "percent"
                  ? `Separas ${plan.savingsValue}% de tus ingresos.`
                  : `Separas ${formatCurrency(plan.savingsValue)} como monto fijo.`}
              </p>
              <Button
                disabled={!!plan.salaryTransactionId || salaryMutation.isPending}
                onClick={() => salaryMutation.mutate()}
                variant={plan.salaryTransactionId ? "secondary" : "default"}
              >
                {plan.salaryTransactionId ? <CheckCircle2Icon /> : null}
                {plan.salaryTransactionId ? "Sueldo registrado" : "Registrar sueldo como ingreso"}
              </Button>
            </div>
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
