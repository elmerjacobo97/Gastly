import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
  markClassName?: string
  markTextClassName?: string
  showText?: boolean
}

export function Logo({
  className,
  markClassName,
  markTextClassName,
  showText = true,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground",
          markClassName
        )}
      >
        <span className={cn("text-lg font-bold leading-none", markTextClassName)}>
          G
        </span>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-lg font-semibold tracking-tight">Gastly</span>
          <span className="mt-0.5 text-xs text-muted-foreground">
            Finanzas personales
          </span>
        </div>
      )}
    </div>
  )
}
