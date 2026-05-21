import { AppSidebar } from "@/features/dashboard/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type DashboardLayoutProps = {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <SidebarTrigger className="md:hidden" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Resumen financiero</span>
            <span className="text-xs text-muted-foreground">
              Control de gastos personales
            </span>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
