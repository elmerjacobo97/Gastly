import Link from 'next/link';
import { ArrowLeftIcon, LayoutDashboardIcon } from 'lucide-react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh overflow-hidden bg-background px-6 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.18),transparent_34%),radial-gradient(circle_at_82%_72%,hsl(var(--primary)/0.12),transparent_30%)]" />
      <div className="absolute left-1/2 top-1/2 h-136 w-136 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/70" />
      <div className="absolute left-1/2 top-1/2 h-88 w-88 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/60" />

      <section className="relative mx-auto flex w-full max-w-5xl flex-col justify-between gap-16">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <Button variant="ghost" asChild>
            <Link href="/login">Iniciar sesion</Link>
          </Button>
        </header>

        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative mx-auto grid aspect-square w-full max-w-xs place-items-center rounded-[2rem] border bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur-sm sm:max-w-sm">
            <div className="absolute inset-4 rounded-[1.5rem] border border-dashed border-primary/30" />
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-[6rem] font-black leading-none tracking-[-0.12em] text-primary sm:text-[8rem]">
                404
              </span>
              <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                Ruta no encontrada
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-7 text-left">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary">Pagina perdida</p>
              <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Esta ruta no existe o ya no esta disponible.
              </h1>
              <p className="max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                Vuelve a tu panel para seguir revisando tus movimientos, presupuestos y metas sin perder el hilo.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  <LayoutDashboardIcon data-icon="inline-start" />
                  Ir al dashboard
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/">
                  <ArrowLeftIcon data-icon="inline-start" />
                  Volver al inicio
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <footer className="text-sm text-muted-foreground">
          Si llegaste aqui desde un enlace guardado, es posible que esa pagina haya cambiado de lugar.
        </footer>
      </section>
    </main>
  );
}
