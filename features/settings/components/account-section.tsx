import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type AccountSectionProps = {
  userEmail: string
  userName: string
}

export function AccountSection({ userEmail, userName }: AccountSectionProps) {
  const displayName = userName || userEmail.split("@")[0] || "Usuario"
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold">Cuenta</h2>
        <p className="text-sm text-muted-foreground">Información de tu perfil.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Tu información de acceso.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
