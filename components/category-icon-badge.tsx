import {
  BanknoteIcon,
  BusIcon,
  CarIcon,
  CircleDollarSignIcon,
  ClapperboardIcon,
  DumbbellIcon,
  GiftIcon,
  GraduationCapIcon,
  HeartPulseIcon,
  HomeIcon,
  LaptopIcon,
  ReceiptIcon,
  ScissorsIcon,
  ShoppingBagIcon,
  SmartphoneIcon,
  TagIcon,
  UtensilsIcon,
  WalletIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

export const categoryIconOptions = [
  { value: "tag", label: "General", icon: TagIcon },
  { value: "food", label: "Comida", icon: UtensilsIcon },
  { value: "transport", label: "Transporte", icon: BusIcon },
  { value: "car", label: "Auto", icon: CarIcon },
  { value: "home", label: "Hogar", icon: HomeIcon },
  { value: "services", label: "Servicios", icon: ReceiptIcon },
  { value: "phone", label: "Celular", icon: SmartphoneIcon },
  { value: "software", label: "Software", icon: LaptopIcon },
  { value: "entertainment", label: "Entretenimiento", icon: ClapperboardIcon },
  { value: "personal-care", label: "Cuidado", icon: ScissorsIcon },
  { value: "health", label: "Salud", icon: HeartPulseIcon },
  { value: "shopping", label: "Compras", icon: ShoppingBagIcon },
  { value: "education", label: "Educación", icon: GraduationCapIcon },
  { value: "fitness", label: "Fitness", icon: DumbbellIcon },
  { value: "gifts", label: "Regalos", icon: GiftIcon },
  { value: "salary", label: "Sueldo", icon: BanknoteIcon },
  { value: "savings", label: "Ahorro", icon: WalletIcon },
  { value: "money", label: "Dinero", icon: CircleDollarSignIcon },
  { value: "tools", label: "Herramientas", icon: WrenchIcon },
] as const

const iconMap = categoryIconOptions.reduce<Record<string, LucideIcon>>(
  (acc, option) => {
    acc[option.value] = option.icon
    return acc
  },
  {}
)

const colorMap: Record<string, string> = {
  red: "#ef4444", orange: "#f97316", amber: "#f59e0b", yellow: "#eab308",
  lime: "#84cc16", green: "#22c55e", emerald: "#10b981", teal: "#14b8a6",
  cyan: "#06b6d4", sky: "#0ea5e9", blue: "#3b82f6", indigo: "#6366f1",
  violet: "#8b5cf6", purple: "#a855f7", pink: "#ec4899", rose: "#f43f5e",
  fuchsia: "#d946ef", slate: "#64748b", zinc: "#71717a", gray: "#6b7280",
  default: "#64748b",
}

export function getCategoryColorHex(color?: string) {
  if (!color) return colorMap.default
  return colorMap[color.toLowerCase()] ?? color
}

export function CategoryIcon({
  name,
  className,
}: {
  name?: string | null
  className?: string
}) {
  const Icon = iconMap[name ?? "tag"] ?? TagIcon
  return <Icon className={className} />
}

export function CategoryIconBadge({
  icon,
  color,
  className,
}: {
  icon?: string | null
  color?: string | null
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg text-white shadow-sm",
        className
      )}
      style={{ background: getCategoryColorHex(color ?? undefined) }}
    >
      <CategoryIcon name={icon} className="size-4" />
    </div>
  )
}
