'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2Icon, CopyIcon, Loader2Icon, SendIcon, UnlinkIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getTelegramConnection } from '@/features/settings/lib/settings-api'
import {
  disconnectTelegram,
  generateTelegramLinkToken,
} from '@/features/settings/server/actions'

export function TelegramConnect() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const queryClient = useQueryClient()

  const connectionQuery = useQuery({
    queryKey: ['telegram-connection'],
    queryFn: getTelegramConnection,
  })

  async function handleGenerate() {
    setIsGenerating(true)
    const result = await generateTelegramLinkToken()
    setIsGenerating(false)

    if (!result || 'error' in result) {
      toast.error('No se pudo generar el código', { description: 'error' in result! ? result.error : undefined })
      return
    }

    setLinkToken(result.token)
  }

  async function handleDisconnect() {
    setIsDisconnecting(true)
    const result = await disconnectTelegram()
    setIsDisconnecting(false)

    if (result && 'error' in result) {
      toast.error('No se pudo desconectar', { description: result.error })
      return
    }

    setLinkToken(null)
    await queryClient.invalidateQueries({ queryKey: ['telegram-connection'] })
    toast.success('Telegram desconectado')
  }

  function handleCopy() {
    if (!linkToken) return
    navigator.clipboard.writeText(`/start ${linkToken}`)
    toast.success('Copiado al portapapeles')
  }

  if (connectionQuery.isLoading) {
    return <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
  }

  const connection = connectionQuery.data

  if (connection) {
    return (
      <div className="flex items-center justify-between rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2Icon className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Cuenta vinculada</p>
            {connection.telegram_username && (
              <p className="text-xs text-muted-foreground">@{connection.telegram_username}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isDisconnecting}
          onClick={handleDisconnect}
          className="text-destructive hover:text-destructive"
        >
          {isDisconnecting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <UnlinkIcon className="size-4" />
          )}
          Desconectar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        <p>Vincula tu cuenta para registrar gastos y consultar tu saldo directamente desde Telegram.</p>
        <div className="mt-3 flex flex-col gap-1 text-xs">
          <span>Comandos disponibles:</span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">/gaste 50 almuerzo</code>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">/ingreso 2500 sueldo</code>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">/saldo · /pagos · /resumen</code>
        </div>
      </div>

      {!linkToken ? (
        <Button
          variant="outline"
          className="w-fit gap-2"
          disabled={isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SendIcon className="size-4" />
          )}
          Generar código de vinculación
        </Button>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Expira en 10 min</Badge>
          </div>
          <p className="text-sm">
            Abre el bot en Telegram y envía este mensaje:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border bg-card px-3 py-2 text-xs font-mono">
              /start {linkToken}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              <CopyIcon className="size-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit text-xs text-muted-foreground"
            onClick={() => { setLinkToken(null); connectionQuery.refetch() }}
          >
            Ya vinculé mi cuenta
          </Button>
        </div>
      )}
    </div>
  )
}
