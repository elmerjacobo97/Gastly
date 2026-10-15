"use client";

import { version } from "@/package.json";
import {
  ArrowLeftRightIcon,
  BarChart3Icon,
  CalendarClockIcon,
  CreditCardIcon,
  GiftIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  PackageIcon,
  TargetIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Resumen",
    href: "/",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    title: "Transacciones",
    href: "/transactions",
    icon: ArrowLeftRightIcon,
    exact: false,
  },
  {
    title: "Presupuestos",
    href: "/budgets",
    icon: WalletCardsIcon,
    exact: false,
  },
  {
    title: "Pagos recurrentes",
    href: "/recurring-payments",
    icon: CalendarClockIcon,
    exact: false,
  },
  {
    title: "Cuotas",
    href: "/installments",
    icon: CreditCardIcon,
    exact: false,
  },
  {
    title: "Préstamos",
    href: "/loans",
    icon: HandCoinsIcon,
    exact: false,
  },
  {
    title: "Encargos",
    href: "/custody",
    icon: PackageIcon,
    exact: false,
  },
  {
    title: "Metas de ahorro",
    href: "/savings",
    icon: TargetIcon,
    exact: false,
  },
  {
    title: "Lista de deseos",
    href: "/wishlist",
    icon: GiftIcon,
    exact: false,
  },
  {
    title: "Reportes",
    href: "/reports",
    icon: BarChart3Icon,
    exact: false,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Gastly">
              <Link href="/" onClick={() => setOpenMobile(false)}>
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-sm font-bold leading-none">G</span>
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
                    <Link href={item.href} onClick={() => setOpenMobile(false)}>
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
        <p className="px-2 pb-1 text-center text-[10px] text-muted-foreground/50">
          v{version}
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
