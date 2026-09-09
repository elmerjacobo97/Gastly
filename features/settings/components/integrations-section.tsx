import { CalendarDaysIcon, SendIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { CalendarConnect } from "./calendar-connect"
import { TelegramConnect, type TelegramConnection } from "./telegram-connect"

type IntegrationsSectionProps = {
  calendarUrl: string
  telegramConnection: TelegramConnection | null
}

export function IntegrationsSection({ calendarUrl, telegramConnection }: IntegrationsSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold">Integraciones</h2>
        <p className="text-sm text-muted-foreground">Conecta Gastly con otras aplicaciones.</p>
      </div>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                <SendIcon className="size-4" />
              </div>
              <div>
                <CardTitle>Telegram</CardTitle>
                <CardDescription>
                  Registra gastos e ingresos y consulta tu saldo directamente desde Telegram.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TelegramConnect connection={telegramConnection} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                <CalendarDaysIcon className="size-4" />
              </div>
              <div>
                <CardTitle>Calendario</CardTitle>
                <CardDescription>
                  Suscripción webcal con pagos recurrentes, cuotas y metas de ahorro.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CalendarConnect url={calendarUrl} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
