"use client"

import { UserIcon } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoriesPanel } from "@/features/categories/components/categories-panel"

type SettingsPanelProps = {
  userEmail: string
  userName: string
}

function ProfileTab({ userEmail, userName }: SettingsPanelProps) {
  const displayName = userName || userEmail.split("@")[0] || "Usuario"

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h2 className="text-lg font-semibold">Perfil</h2>
        <p className="text-sm text-muted-foreground">
          Información de tu cuenta.
        </p>
      </div>
      <div className="flex items-center gap-4 rounded-xl border p-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserIcon className="size-5" />
        </div>
        <div>
          <p className="font-medium">{displayName}</p>
          <p className="text-sm text-muted-foreground">{userEmail}</p>
        </div>
      </div>
    </div>
  )
}

export function SettingsPanel({ userEmail, userName }: SettingsPanelProps) {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Configuración</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra tus categorías y preferencias de cuenta.
          </p>
        </div>
      </section>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          <CategoriesPanel embedded />
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <ProfileTab userEmail={userEmail} userName={userName} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
