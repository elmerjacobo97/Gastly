import { cn } from "@/lib/utils"
import {
  categoryIconMap,
  getCategoryColorHex,
} from "@/components/category-icon-data"

export function CategoryIcon({
  name,
  className,
}: {
  name?: string | null
  className?: string
}) {
  const Icon = categoryIconMap[name ?? "tag"] ?? categoryIconMap.tag
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
