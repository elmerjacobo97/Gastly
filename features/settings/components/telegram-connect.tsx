'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangleIcon, CheckCircle2Icon, CopyIcon, ExternalLinkIcon, Loader2Icon, RefreshCwIcon, SendIcon, UnlinkIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  disconnectTelegram,
  generateTelegramLinkToken,
} from '@/features/settings/server/actions'

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? ''

export type TelegramConnection = {
  telegram_user_id: string
  telegram_username: string | null
  created_at: string
}

type TelegramConnectProps = {
  connection: TelegramConnection | null
}

export function TelegramConnect({ connection }: TelegramConnectProps) {
  const router = useRouter()
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  async function handleGenerate() {
    setActionError(null)
    setIsGenerating(true)
    const result = await generateTelegramLinkToken()
    setIsGenerating(false)
    if (!result || 'error' in result) {
      setActionError(result && 'error' in result ? result.error : 'No se pudo generar el código de vinculación.')
      toast.error('No se pudo generar el código')
      return
    }
    setLinkToken(result.token)
  }

  async function handleDisconnect() {
    setActionError(null)
    setIsDisconnecting(true)
    const result = await disconnectTelegram()
    setIsDisconnecting(false)
    if (result && 'error' in result) {
      setActionError(result.error)
      toast.error('No se pudo desconectar', { description: result.error })
      return
    }
    setLinkToken(null)
    toast.success('Telegram desconectado')
    router.refresh()
  }

  function handleCopy() {
    if (!linkToken) return
    navigator.clipboard.writeText(`/start ${linkToken}`)
    toast.success('Copiado al portapapeles')
  }

  if (connection) {
    return (
      <div className="flex flex-col gap-3">
        {actionError && (
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>No se pudo completar la acción</AlertTitle>
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Cuenta vinculada</p>
              <p className="text-xs text-muted-foreground">
                {connection.telegram_username ? `@${connection.telegram_username}` : 'Telegram conectado'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isDisconnecting}
            onClick={handleDisconnect}
            className="text-destructive hover:text-destructive"
          >
            {isDisconnecting ? <Loader2Icon className="size-4 animate-spin" /> : <UnlinkIcon className="size-4" />}
            Desconectar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {actionError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudo completar la acción</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
      {/* Step 1 */}
      <div className="rounded-xl border p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
          <p className="text-sm font-medium">Abre el bot en Telegram</p>
        </div>
        <div className="flex flex-col gap-3">
          {BOT_USERNAME && (
            <Button variant="outline" size="sm" className="w-fit gap-2" asChild>
              <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon className="size-3.5" />
                Abrir @{BOT_USERNAME}
              </a>
            </Button>
          )}
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="mb-2 text-xs font-medium">Comandos disponibles:</p>
            <div className="flex flex-col gap-1 font-mono text-xs text-muted-foreground">
              <span>/gaste 50 almuerzo</span>
              <span>/ingreso 2500 sueldo</span>
              <span>/saldo · /pagos · /resumen</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="rounded-xl border p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
          <p className="text-sm font-medium">Genera tu código de vinculación</p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Único y expira en 10 minutos.</p>
          {!linkToken ? (
            <Button
              variant="outline"
              size="sm"
              className="w-fit gap-2"
              disabled={isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? <Loader2Icon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
              Generar código
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Badge variant="secondary" className="w-fit text-xs">Expira en 10 min</Badge>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border bg-card px-3 py-2 text-xs font-mono">
                  /start {linkToken}
                </code>
                <Button variant="outline" size="icon" className="shrink-0" onClick={handleCopy}>
                  <CopyIcon className="size-4" />
                  <span className="sr-only">Copiar</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 3 */}
      <div className="rounded-xl border p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</span>
          <p className="text-sm font-medium">Envía el mensaje al bot</p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Copia el código del paso 2 y pégalo en el chat del bot. El bot confirmará la vinculación.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit gap-2 text-xs text-muted-foreground"
            onClick={() => router.refresh()}
          >
            <RefreshCwIcon className="size-3.5" />
            Ya lo envié, verificar vinculación
          </Button>
        </div>
      </div>
    </div>
  )
}
