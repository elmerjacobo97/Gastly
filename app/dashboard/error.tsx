'use client'

import { useEffect } from 'react'
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangleIcon className="size-7" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">No se pudo cargar esta sección</h2>
        <p className="max-w-sm text-pretty text-sm text-muted-foreground">
          Hubo un problema al cargar los datos. Puedes intentar de nuevo.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={() => unstable_retry()}>
          <RefreshCwIcon data-icon="inline-start" />
          Intentar de nuevo
        </Button>
      </div>
    </div>
  )
}
