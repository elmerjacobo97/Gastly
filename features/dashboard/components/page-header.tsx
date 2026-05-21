"use client"

import { usePathname } from "next/navigation"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/features/dashboard/components/theme-toggle"

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Resumen",
    description: "Vista general de tus finanzas",
  },
  "/dashboard/expenses": {
    title: "Gastos",
    description: "Control de tus egresos",
  },
  "/dashboard/income": {
    title: "Ingresos",
    description: "Control de tus entradas",
  },
  "/dashboard/categories": {
    title: "Categorías",
    description: "Organiza tus movimientos",
  },
  "/dashboard/budget": {
    title: "Presupuesto",
    description: "Límites de gasto por categoría",
  },
  "/dashboard/reports": {
    title: "Reportes",
    description: "Exporta y analiza tus datos",
  },
}

export function PageHeader() {
  const pathname = usePathname()
  const page = PAGE_TITLES[pathname] ?? PAGE_TITLES["/dashboard"]

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <SidebarTrigger className="-ml-1 md:hidden" />
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-semibold leading-none">{page.title}</span>
        <span className="mt-0.5 text-xs text-muted-foreground">
          {page.description}
        </span>
      </div>
      <ThemeToggle />
    </header>
  )
}
