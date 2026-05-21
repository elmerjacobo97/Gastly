"use client"

import { usePathname } from "next/navigation"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/features/dashboard/components/theme-toggle"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Resumen",
  "/dashboard/transactions": "Movimientos",
  "/dashboard/monthly-plan": "Plan mensual",
  "/dashboard/budget": "Presupuesto",
  "/dashboard/fixed-expenses": "Pagos recurrentes",
  "/dashboard/installments": "Cuotas",
  "/dashboard/loans": "Préstamos",
  "/dashboard/reports": "Reportes",
  "/dashboard/settings": "Configuración",
  "/dashboard/categories": "Categorías",
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const parent = Object.keys(PAGE_TITLES)
    .filter((k) => pathname.startsWith(k) && k !== "/dashboard")
    .sort((a, b) => b.length - a.length)[0]
  return parent ? PAGE_TITLES[parent] : "Gastly"
}

export function PageHeader() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex flex-1 items-center gap-2 px-3 md:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-1 hidden data-vertical:h-4 data-vertical:self-auto md:block"
        />
        <span className="truncate text-sm font-medium md:hidden">{pageTitle}</span>
        <span className="hidden text-sm text-muted-foreground md:block">
          Gastly
          <span className="mx-2 text-muted-foreground/50">·</span>
          <span className="text-foreground">{pageTitle}</span>
        </span>
      </div>
      <div className="px-3 md:px-4">
        <ThemeToggle />
      </div>
    </header>
  )
}
