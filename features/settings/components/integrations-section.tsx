import { SendIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { TelegramConnect } from "./telegram-connect"

export function IntegrationsSection() {
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
            <TelegramConnect />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
