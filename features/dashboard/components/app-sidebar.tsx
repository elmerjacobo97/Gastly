import {
  ChartNoAxesColumnIncreasingIcon,
  CircleDollarSignIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  PiggyBankIcon,
  PlusIcon,
  SettingsIcon,
  TagsIcon,
} from "lucide-react"
import Link from "next/link"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { signOut } from "@/features/auth/server/actions"

const navigationItems = [
  {
    title: "Resumen",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    isActive: true,
    isAvailable: true,
  },
  {
    title: "Gastos",
    icon: CreditCardIcon,
    badge: "Pronto",
  },
  {
    title: "Ingresos",
    icon: CircleDollarSignIcon,
    badge: "Pronto",
  },
  {
    title: "Categorias",
    href: "/dashboard/categories",
    icon: TagsIcon,
    isAvailable: true,
  },
  {
    title: "Presupuesto",
    icon: PiggyBankIcon,
    badge: "Pronto",
  },
  {
    title: "Reportes",
    icon: ChartNoAxesColumnIncreasingIcon,
    badge: "Pronto",
  },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader>
        <Link
          className="flex rounded-lg p-2 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          href="/dashboard"
        >
          <Logo markClassName="size-9 rounded-xl shadow-none" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Finanzas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.isAvailable ? (
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton disabled>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                  {item.badge ? (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Acciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <PlusIcon />
                  <span>Nuevo gasto</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>Pronto</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <SettingsIcon />
                  <span>Configuracion</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>Pronto</SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={signOut}>
              <Button className="w-full" type="submit" variant="outline">
                Salir
              </Button>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
