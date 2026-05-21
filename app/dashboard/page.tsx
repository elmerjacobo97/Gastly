import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarDaysIcon,
  ChartNoAxesColumnIncreasingIcon,
  PlusIcon,
  WalletCardsIcon,
} from "lucide-react"
import { redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { createClient } from "@/lib/supabase/server"

const summaryCards = [
  {
    title: "Balance del mes",
    value: "S/ 0.00",
    description: "Sin movimientos registrados",
    icon: WalletCardsIcon,
  },
  {
    title: "Ingresos",
    value: "S/ 0.00",
    description: "Pendiente de configurar",
    icon: ArrowUpIcon,
  },
  {
    title: "Gastos",
    value: "S/ 0.00",
    description: "Listo para empezar",
    icon: ArrowDownIcon,
  },
  {
    title: "Presupuesto",
    value: "0%",
    description: "Crea tu primer presupuesto",
    icon: ChartNoAxesColumnIncreasingIcon,
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Badge className="w-fit" variant="secondary">
            Cuenta activa
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Panel de gastos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bienvenido {user.email}. Empieza registrando tus primeros movimientos.
            </p>
          </div>
        </div>
        <Button disabled>
          <PlusIcon data-icon="inline-start" />
          Nuevo gasto
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="mt-2 text-2xl">{card.value}</CardTitle>
              </div>
              <div className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                <card.icon />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Primeros pasos</CardTitle>
            <CardDescription>
              La estructura esta lista. Falta crear las tablas y conectar el CRUD.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <WalletCardsIcon />
                </EmptyMedia>
                <EmptyTitle>Aun no tienes movimientos</EmptyTitle>
                <EmptyDescription>
                  El siguiente paso es crear gastos, ingresos, categorias y reglas de seguridad en Supabase.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button disabled>Agregar primer gasto</Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen rapido</CardTitle>
            <CardDescription>Estado inicial de tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                <CalendarDaysIcon />
              </div>
              <div>
                <p className="text-sm font-medium">Mes actual</p>
                <p className="text-sm text-muted-foreground">Sin gastos registrados</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                <ChartNoAxesColumnIncreasingIcon />
              </div>
              <div>
                <p className="text-sm font-medium">Reportes</p>
                <p className="text-sm text-muted-foreground">Disponibles al tener datos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
