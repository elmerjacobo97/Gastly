import { Logo } from "@/components/logo"
import { privateMetadata } from "@/lib/seo"

export const metadata = privateMetadata

type AuthLayoutProps = {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-muted/30 px-6 py-12">
      <div className="absolute inset-x-0 top-0 h-72 bg-linear-to-b from-primary/15 via-primary/5 to-transparent" />
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
        <header className="flex flex-col items-center gap-3 text-center">
          <Logo
            showText={false}
            markClassName="size-12 rounded-lg"
            markTextClassName="text-xl"
          />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Gastly</h1>
            <p className="max-w-sm text-pretty text-sm leading-6 text-muted-foreground">
              Controla tus ingresos, gastos y presupuestos en un solo lugar.
            </p>
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}
