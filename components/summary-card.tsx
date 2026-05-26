import { type LucideIcon } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SummaryCardVariant = "default" | "positive" | "negative" | "warning"

type SummaryCardProps = {
  title: string
  value: React.ReactNode
  description?: React.ReactNode
  icon?: LucideIcon
  variant?: SummaryCardVariant
  className?: string
}

const variantStyles: Record<
  SummaryCardVariant,
  { value: string; iconBg: string }
> = {
  default: {
    value: "",
    iconBg: "bg-muted/50 text-muted-foreground",
  },
  positive: {
    value: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  negative: {
    value: "text-destructive",
    iconBg: "bg-destructive/10 text-destructive",
  },
  warning: {
    value: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
}

export function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  className,
}: SummaryCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          <div className={cn("mt-1.5 text-xl font-semibold tabular-nums", styles.value)}>
            {value}
          </div>
        </div>
        {Icon && (
          <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl", styles.iconBg)}>
            <Icon className="size-4" />
          </div>
        )}
      </CardHeader>
      {description != null && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      )}
    </Card>
  )
}
