"use client"

import { useRouter } from "next/navigation"
import { addMonths, format, isSameMonth, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

type MonthNavProps = {
  value: Date
  basePath?: string
  onChange?: (date: Date) => void
  allowFuture?: boolean
}

export function MonthNav({ value, basePath, onChange, allowFuture = false }: MonthNavProps) {
  const router = useRouter()
  const isCurrentMonth = isSameMonth(value, new Date())

  function navigate(date: Date) {
    if (onChange) {
      onChange(date)
      return
    }
    const month = format(date, "yyyy-MM")
    const target = basePath ?? window.location.pathname
    router.push(`${target}?month=${month}`)
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon-sm"
        variant="outline"
        onClick={() => navigate(subMonths(value, 1))}
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
        onClick={() => navigate(addMonths(value, 1))}
        disabled={!allowFuture && isCurrentMonth}
        aria-label="Mes siguiente"
      >
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  )
}
