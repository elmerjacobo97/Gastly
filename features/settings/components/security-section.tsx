import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { ChangePasswordForm } from "./change-password-form"

export function SecuritySection() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold">Seguridad</h2>
        <p className="text-sm text-muted-foreground">Gestiona tu contraseña de acceso.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>Actualiza tu contraseña regularmente para mantener tu cuenta segura.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
