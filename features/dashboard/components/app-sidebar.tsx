"use client"

import {
  BarChart3Icon,
  CreditCardIcon,
  CircleDollarSignIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PiggyBankIcon,
  TagsIcon,
  UserIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { signOut } from "@/features/auth/server/actions"

const navigationItems = [
  {
    title: "Resumen",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    title: "Gastos",
    href: "/dashboard/expenses",
    icon: CreditCardIcon,
    exact: false,
  },
  {
    title: "Ingresos",
    href: "/dashboard/income",
    icon: CircleDollarSignIcon,
    exact: false,
  },
  {
    title: "Categorías",
    href: "/dashboard/categories",
    icon: TagsIcon,
    exact: false,
  },
  {
    title: "Presupuesto",
    href: "/dashboard/budget",
    icon: PiggyBankIcon,
    exact: false,
  },
  {
    title: "Reportes",
    href: "/dashboard/reports",
    icon: BarChart3Icon,
    exact: false,
  },
]

type AppSidebarProps = {
  userEmail?: string
  userName?: string
}

export function AppSidebar({ userEmail, userName }: AppSidebarProps) {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const displayName = userName || userEmail?.split("@")[0] || "Usuario"
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader className="pb-0">
        <Link
          className="flex rounded-lg p-2 transition-colors hover:bg-sidebar-accent"
          href="/dashboard"
        >
          <Logo markClassName="size-9 rounded-xl shadow-none" />
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="my-2" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href, item.exact)}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </div>
                  <div className="flex min-w-0 flex-col text-left leading-tight">
                    <span className="truncate text-sm font-medium">
                      {displayName}
                    </span>
                    {userEmail && (
                      <span className="truncate text-xs text-muted-foreground">
                        {userEmail}
                      </span>
                    )}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="font-medium">{displayName}</span>
                  {userEmail && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {userEmail}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={signOut} className="w-full">
                    <Button
                      className="h-auto w-full justify-start gap-2 p-0 font-normal"
                      type="submit"
                      variant="ghost"
                    >
                      <LogOutIcon className="size-4" />
                      Cerrar sesión
                    </Button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
