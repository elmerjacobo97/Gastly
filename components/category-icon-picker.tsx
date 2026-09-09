"use client"

import { Button } from "@/components/ui/button"
import { CategoryIcon } from "@/components/category-icon-badge"
import { categoryIconOptions } from "@/components/category-icon-data"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type CategoryIconPickerProps = {
  value?: string
  onChange: (value: string) => void
}

export function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-5 gap-2 rounded-lg border p-3 sm:grid-cols-6">
        {categoryIconOptions.map((option) => (
          <Tooltip key={option.value}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={() => onChange(option.value)}
                className={cn(
                  "border text-muted-foreground hover:bg-muted hover:text-foreground",
                  value === option.value &&
                    "border-primary bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                )}
              >
                <CategoryIcon name={option.value} className="size-4" />
                <span className="sr-only">{option.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{option.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
