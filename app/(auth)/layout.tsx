import { Logo } from "@/components/logo"

type AuthLayoutProps = {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-muted/30 px-6 py-12">
      <div className="absolute inset-x-0 top-0 h-72 bg-linear-to-b from-primary/15 via-primary/5 to-transparent" />
      <div className="absolute left-1/2 top-16 size-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex w-full max-w-md flex-col items-center gap-8">
        <header className="flex flex-col items-center gap-4 text-center">
          <Logo className="justify-center" />
          <div className="flex flex-col gap-2">
            <h1 className="text-balance text-3xl font-semibold tracking-tight">
              Tus finanzas, ordenadas
            </h1>
            <p className="max-w-sm text-pretty text-sm leading-6 text-muted-foreground">
              Registra ingresos y gastos, define presupuestos por categoría y
              mantén el control de tu dinero mes a mes.
            </p>
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}
