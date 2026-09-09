"use client"

import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ColorOption = string | { value: string; hex: string }

type ColorPickerProps = {
  options: readonly ColorOption[]
  value?: string
  onChange: (value: string) => void
}

function normalizeColorOption(option: ColorOption) {
  return typeof option === "string" ? { value: option, hex: option } : option
}

export function ColorPicker({ options, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border p-3">
      {options.map((rawOption) => {
        const option = normalizeColorOption(rawOption)
        const selected = value === option.value

        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full hover:bg-transparent hover:scale-110",
              selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
            style={{ backgroundColor: option.hex }}
            aria-label={option.value}
            title={option.value}
          >
            {selected && <CheckIcon className="size-3.5 text-white drop-shadow-sm" />}
          </Button>
        )
      })}
    </div>
  )
}
