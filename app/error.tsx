'use client';

import { useEffect } from 'react';
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';
import Link from 'next/link';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex min-h-svh overflow-hidden bg-background px-6 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.18),transparent_34%),radial-gradient(circle_at_82%_72%,hsl(var(--primary)/0.12),transparent_30%)]" />

      <section className="relative mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-8 text-center">
        <Logo />

        <div className="flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangleIcon className="size-7" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Algo salió mal</h1>
            <p className="max-w-sm text-pretty text-sm text-muted-foreground">
              Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={() => unstable_retry()}>
            <RefreshCwIcon data-icon="inline-start" />
            Intentar de nuevo
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
