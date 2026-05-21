"use client"

import {
  BarChart3Icon,
  CreditCardIcon,
  CircleDollarSignIcon,
  ChevronsUpDownIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PiggyBankIcon,
  TagsIcon,
  WalletCardsIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  SidebarRail,
  useSidebar,
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

function UserFooter({ userEmail, userName }: AppSidebarProps) {
  const { isMobile } = useSidebar()

  const displayName = userName || userEmail?.split("@")[0] || "Usuario"
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg shrink-0">
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                {userEmail && (
                  <span className="truncate text-xs text-muted-foreground">
                    {userEmail}
                  </span>
                )}
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg shrink-0">
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  {userEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                      {userEmail}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={signOut} className="w-full">
                <button type="submit" className="flex w-full items-center gap-2">
                  <LogOutIcon className="size-4" />
                  Cerrar sesión
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ userEmail, userName }: AppSidebarProps) {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Gastly">
              <Link href="/dashboard">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <WalletCardsIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Gastly</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Finanzas personales
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href, item.exact)}
                    tooltip={item.title}
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
        <UserFooter userEmail={userEmail} userName={userName} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
