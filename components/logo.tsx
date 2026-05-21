import { ChartNoAxesColumnIncreasingIcon, WalletCardsIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
  markClassName?: string
  showText?: boolean
}

export function Logo({ className, markClassName, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative grid size-12 place-items-center rounded-2xl border bg-card text-card-foreground shadow-lg shadow-foreground/10 ring-1 ring-foreground/5",
          markClassName
        )}
      >
        <div className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
          <ChartNoAxesColumnIncreasingIcon className="size-3" />
        </div>
        <WalletCardsIcon className="size-6" />
      </div>
      {showText ? (
        <div className="flex flex-col leading-none">
          <span className="font-heading text-xl font-semibold tracking-tight">
            Gastly
          </span>
          <span className="mt-1 text-xs font-medium text-muted-foreground">
            Personal expense manager
          </span>
        </div>
      ) : null}
    </div>
  )
}
