'use client'

import { useEffect } from 'react'
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react'

export default function GlobalError({
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
    <html lang="es-PE">
      <body className="min-h-svh bg-background px-6 py-8">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangleIcon className="size-7" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Error inesperado</h1>
            <p className="max-w-sm text-pretty text-sm text-muted-foreground">
              La aplicación encontró un problema. Intenta recargar la página.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => unstable_retry()}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
            >
              <RefreshCwIcon className="size-4" />
              Recargar página
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
