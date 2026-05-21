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
  }>
}

export default async function CheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  const params = await searchParams

  return (
    <Card className="w-full max-w-md border-foreground/10 text-center shadow-xl shadow-foreground/5">
      <CardHeader className="items-center">
        <div className="grid size-12 place-items-center rounded-2xl border bg-card text-card-foreground shadow-lg shadow-foreground/10 ring-1 ring-foreground/5">
          <MailCheckIcon className="size-6" />
        </div>
        <CardTitle>Revisa tu correo</CardTitle>
        <CardDescription>
          Te enviamos un enlace para activar tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          Abre el enlace que enviamos a{" "}
          {params.email ? (
            <span className="font-medium text-foreground">{params.email}</span>
          ) : (
            "tu correo"
          )}
          . Una vez confirmado, podrás acceder a tu cuenta.
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
