import { Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { CategoriesPanel } from "@/features/categories/components/categories-panel"
import { CreateCategoryDialog } from "@/features/categories/components/create-category-dialog"
import { CategoriesSection } from "@/features/settings/components/categories-section"
import { getCategories } from "@/features/categories/server/queries"
import { getTelegramConnection } from "@/features/settings/server/queries"
import { SettingsPanel } from "@/features/settings/components/settings-panel"
import { encodeCalendarToken } from "@/lib/calendar-token"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const headersList = await headers()
  const host = headersList.get("host") ?? ""

  const calendarToken = encodeCalendarToken(user.id)
  const calendarUrl = host ? `webcal://${host}/api/calendar/${calendarToken}.ics` : ""
  const [categories, telegramConnection] = await Promise.all([
    getCategories(),
    getTelegramConnection(),
  ])

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Cargando configuración...
        </div>
      }
    >
      <SettingsPanel
        userEmail={user.email ?? ""}
        userName={user.user_metadata?.full_name ?? ""}
        calendarUrl={calendarUrl}
        telegramConnection={telegramConnection}
        categoriesSection={
          <CategoriesSection
            categoriesPanel={<CategoriesPanel categories={categories} embedded />}
            createCategoryDialog={<CreateCategoryDialog />}
          />
        }
      />
    </Suspense>
  )
}
