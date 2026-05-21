import { cn } from "@/lib/utils"

type Option<T extends string> = {
  value: T
  label: string
}

type SegmentedControlProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  className?: string
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={cn("flex rounded-md border p-0.5 gap-0.5", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            opt.value === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
