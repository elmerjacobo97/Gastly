import { type LucideIcon, BellRingIcon } from "lucide-react"

import {
  Alert,
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

export type DashboardAlert = {
  key: string
  icon: LucideIcon
  title: string
  description: string
  variant: "destructive" | "warning" | "default"
}

type DashboardAlertsProps = {
  alerts: DashboardAlert[]
}

export function DashboardAlerts({ alerts }: DashboardAlertsProps) {
  if (alerts.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BellRingIcon className="size-5 text-muted-foreground" />
          <CardTitle className="text-base">Alertas inteligentes</CardTitle>
        </div>
        <CardDescription>
          Avisos persistentes para pagos, presupuestos y dinero disponible.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {alerts.map((alert) => (
          <Alert key={alert.key} variant={alert.variant}>
            <alert.icon />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
