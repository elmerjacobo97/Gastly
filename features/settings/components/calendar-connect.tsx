"use client"

import { CalendarIcon, CheckIcon, CopyIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

type CalendarConnectProps = {
  token: string
}

export function CalendarConnect({ token }: CalendarConnectProps) {
  const [webcalUrl, setWebcalUrl] = useState("")
  const [httpsUrl, setHttpsUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const base = `${window.location.host}/api/calendar/${token}.ics`
    setWebcalUrl(`webcal://${base}`)
    setHttpsUrl(`${window.location.protocol}//${base}`)
  }, [token])

  function copy() {
    if (!webcalUrl) return
    navigator.clipboard.writeText(webcalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function subscribe() {
    if (!webcalUrl) return
    window.location.href = webcalUrl
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit gap-1.5">
          <CalendarIcon className="size-3" />
          Se configura una sola vez · se actualiza automáticamente
        </Badge>
        <p className="text-sm text-muted-foreground">
          Suscribes tu app de calendario a Gastly una vez. Cada vez que tu calendario se sincroniza (cada pocas horas), verá tus datos más recientes. No tienes que hacer nada cada mes.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aparecerá en tu calendario</p>
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
            Pagos recurrentes activos — con alarma 2 días antes
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
            Cuotas pendientes — con alarma 1 día antes
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
            Metas de ahorro con fecha límite
          </li>
        </ul>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Tu URL de suscripción</p>
        <div className="flex gap-2">
          <Input
            readOnly
            value={webcalUrl || "Cargando..."}
            className="font-mono text-xs"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button variant="outline" size="icon" onClick={copy} disabled={!webcalUrl}>
            {copied
              ? <CheckIcon className="size-4 text-emerald-500" />
              : <CopyIcon className="size-4" />}
            <span className="sr-only">Copiar URL</span>
          </Button>
        </div>

        <Button onClick={subscribe} disabled={!webcalUrl} className="w-fit gap-2">
          <CalendarIcon className="size-4" />
          Suscribir en Calendar
        </Button>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Instrucciones por plataforma</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium mb-1.5">iPhone / Mac</p>
            <ol className="flex flex-col gap-1 text-xs text-muted-foreground list-decimal list-inside">
              <li>Copia la URL de arriba</li>
              <li>Abre Safari y pega la URL</li>
              <li>Safari pregunta si suscribirse → Aceptar</li>
            </ol>
            <p className="mt-2 text-xs text-muted-foreground">
              O: Configuración → Calendario → Cuentas → Agregar cuenta → Otra → Calendario suscrito
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium mb-1.5">Google Calendar</p>
            <ol className="flex flex-col gap-1 text-xs text-muted-foreground list-decimal list-inside">
              <li>Ve a calendar.google.com</li>
              <li>Click <span className="font-medium">+</span> junto a "Otros calendarios"</li>
              <li>Selecciona "Desde URL"</li>
              <li>Pega la URL y confirma</li>
            </ol>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          La URL es privada y única para tu cuenta. Si la compartes, otros verán tus datos.
        </p>
      </div>
    </div>
  )
}
