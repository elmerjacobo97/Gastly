import { MailCheckIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type CheckEmailPageProps = {
  searchParams: Promise<{
    email?: string
    mode?: string
  }>
}

export default async function CheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  const params = await searchParams
  const isReset = params.mode === "reset"

  return (
    <Card className="w-full max-w-md border-foreground/10 shadow-xl shadow-foreground/5">
      <CardHeader className="items-center text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl border bg-card text-card-foreground shadow-lg shadow-foreground/10 ring-1 ring-foreground/5">
          <MailCheckIcon className="size-6" />
        </div>
        <CardTitle>Revisa tu correo</CardTitle>
        <CardDescription>
          {isReset
            ? "Te enviamos un enlace para restablecer tu contraseña."
            : "Te enviamos un enlace para activar tu cuenta."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm leading-6 text-muted-foreground">
          Abre el enlace que enviamos a{" "}
          {params.email ? (
            <span className="font-medium text-foreground">{params.email}</span>
          ) : (
            "tu correo"
          )}
          .{" "}
          {isReset
            ? "Sigue las instrucciones para crear una nueva contraseña."
            : "Una vez confirmado, podrás acceder a tu cuenta."}
        </p>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Button asChild className="w-full" variant="outline">
          <Link href="/login">Volver al inicio de sesión</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
