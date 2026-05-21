import { CatIcon } from "lucide-react"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { signOut } from "@/features/auth/actions"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Gastly</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Panel de gatos
          </h1>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Salir
          </Button>
        </form>
      </header>
      <Separator className="mt-6" />
      <section className="grid flex-1 place-items-center py-20">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CatIcon />
            </EmptyMedia>
            <EmptyTitle>Auth listo para {user.email}</EmptyTitle>
            <EmptyDescription>
              El siguiente paso es crear las tablas y el modulo para registrar tus gatos.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button disabled>Agregar gato</Button>
          </EmptyContent>
        </Empty>
      </section>
    </main>
  )
}
