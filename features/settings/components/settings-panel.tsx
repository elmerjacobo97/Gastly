"use client"

import { KeyRoundIcon, TagIcon, UserIcon, ZapIcon } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"

import { AccountSection } from "./account-section"
import { CategoriesSection } from "./categories-section"
import { IntegrationsSection } from "./integrations-section"
import { SecuritySection } from "./security-section"

const NAV_ITEMS = [
  { id: "account", label: "Cuenta", icon: UserIcon },
  { id: "security", label: "Seguridad", icon: KeyRoundIcon },
  { id: "categories", label: "Categorías", icon: TagIcon },
  { id: "integrations", label: "Integraciones", icon: ZapIcon },
] as const

type SectionId = (typeof NAV_ITEMS)[number]["id"]

const VALID_IDS = NAV_ITEMS.map((n) => n.id) as readonly string[]

type SettingsPanelProps = {
  userEmail: string
  userName: string
}

export function SettingsPanel({ userEmail, userName }: SettingsPanelProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const raw = searchParams.get("section")
  const activeSection: SectionId = VALID_IDS.includes(raw ?? "") ? (raw as SectionId) : "account"

  function navigate(id: SectionId) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("section", id)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Administra tu cuenta y preferencias.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <nav className="flex flex-row gap-1 overflow-x-auto pb-1 lg:w-44 lg:shrink-0 lg:flex-col lg:pb-0">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeSection === id ? "secondary" : "ghost"}
              onClick={() => navigate(id)}
              className="shrink-0 justify-start gap-2 lg:w-full"
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {activeSection === "account" && <AccountSection userEmail={userEmail} userName={userName} />}
          {activeSection === "security" && <SecuritySection />}
          {activeSection === "categories" && <CategoriesSection />}
          {activeSection === "integrations" && <IntegrationsSection />}
        </div>
      </div>
    </main>
  )
}
