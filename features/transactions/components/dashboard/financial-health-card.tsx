import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

function getHealthState(usage: number, remaining: number) {
  if (remaining < 0 || usage >= 100) {
    return {
      label: "Rojo",
      description: "Ya te pasaste del dinero disponible.",
      className: "text-destructive",
      progressClassName: "[&>div]:bg-destructive",
    }
  }
  if (usage >= 85) {
    return {
      label: "Naranja",
      description: "Estás muy cerca del límite.",
      className: "text-orange-600 dark:text-orange-400",
      progressClassName: "[&>div]:bg-orange-500",
    }
  }
  if (usage >= 70) {
    return {
      label: "Amarillo",
      description: "Vas bien, pero conviene cuidar gastos.",
      className: "text-amber-600 dark:text-amber-400",
      progressClassName: "[&>div]:bg-amber-500",
    }
  }
  return {
    label: "Verde",
    description: "Tienes margen saludable para el mes.",
    className: "text-emerald-600 dark:text-emerald-400",
    progressClassName: "[&>div]:bg-emerald-500",
  }
}

type FinancialHealthCardProps = {
  usage: number
  remaining: number
}

export function FinancialHealthCard({ usage, remaining }: FinancialHealthCardProps) {
  const health = getHealthState(usage, remaining)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardDescription>Estado del mes</CardDescription>
            <CardTitle className={`mt-1 text-3xl ${health.className}`}>
              {health.label}
            </CardTitle>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-muted-foreground">Restante libre</p>
            <p className={`text-2xl font-semibold tabular-nums ${remaining < 0 ? "text-destructive" : "text-foreground"}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={Math.min(usage, 100)} className={health.progressClassName} />
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{health.description}</span>
          <span className="tabular-nums">{usage}% usado</span>
        </div>
      </CardContent>
    </Card>
  )
}
