"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { format, addMonths, subMonths, isSameMonth } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"

type MonthNavProps = {
  value: Date
  onChange: (date: Date) => void
}

export function MonthNav({ value, onChange }: MonthNavProps) {
  const isCurrentMonth = isSameMonth(value, new Date())

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon-sm"
        variant="outline"
        onClick={() => onChange(subMonths(value, 1))}
        aria-label="Mes anterior"
      >
        <ChevronLeftIcon className="size-4" />
      </Button>
      <span className="min-w-[7rem] text-center text-sm font-medium capitalize">
        {format(value, "MMMM yyyy", { locale: es })}
      </span>
      <Button
        size="icon-sm"
        variant="outline"
        onClick={() => onChange(addMonths(value, 1))}
        disabled={isCurrentMonth}
        aria-label="Mes siguiente"
      >
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  )
}
