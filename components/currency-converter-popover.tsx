"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { ArrowLeftRightIcon, CoinsIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { NumberInput } from "@/components/ui/number-input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fetchExchangeRate } from "@/features/transactions/lib/exchange-rate-api"

const CURRENCIES = ["PEN", "USD", "MXN"] as const
type Currency = (typeof CURRENCIES)[number]

const CURRENCY_SYMBOL: Record<Currency, string> = {
  PEN: "S/",
  USD: "US$",
  MXN: "MX$",
}

function formatConverted(value: number, currency: Currency): string {
  return `${CURRENCY_SYMBOL[currency]} ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function CurrencyConverterPopover() {
  const [amount, setAmount] = useState<number>(100)
  const [from, setFrom] = useState<Currency>("USD")
  const [to, setTo] = useState<Currency>("PEN")

  const { data: rate, isFetching, isError, refetch } = useQuery({
    queryKey: ["exchange-rate", from, to],
    queryFn: () => fetchExchangeRate(from, to),
    enabled: from !== to,
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
  })

  const effectiveRate = from === to ? 1 : rate
  const converted = effectiveRate != null && amount > 0 ? amount * effectiveRate : null

  function swap() {
    setFrom(to)
    setTo(from)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" className="size-12 rounded-full shadow-lg">
            <CoinsIcon className="size-5" />
            <span className="sr-only">Conversor de moneda</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-72 p-4">
          <p className="mb-3 text-sm font-semibold">Conversor de moneda</p>

          <div className="flex items-center gap-2">
            <NativeSelect
              value={from}
              onChange={(e) => setFrom(e.target.value as Currency)}
              className="flex-1"
            >
              {CURRENCIES.map((c) => (
                <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
              ))}
            </NativeSelect>
            <Button variant="ghost" size="icon-sm" onClick={swap} type="button" className="shrink-0">
              <ArrowLeftRightIcon className="size-4" />
              <span className="sr-only">Intercambiar</span>
            </Button>
            <NativeSelect
              value={to}
              onChange={(e) => setTo(e.target.value as Currency)}
              className="flex-1"
            >
              {CURRENCIES.map((c) => (
                <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <NumberInput
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="mt-2 w-full tabular-nums"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="100.00"
          />

          <div className="mt-3 min-h-[4rem] border-t pt-3">
            {isError ? (
              <>
                <p className="text-sm text-destructive">Error al obtener tasa</p>
                <button
                  onClick={() => refetch()}
                  className="mt-0.5 text-xs text-muted-foreground underline underline-offset-2"
                >
                  Reintentar
                </button>
              </>
            ) : (
              <div className={isFetching && from !== to ? "opacity-50 transition-opacity" : "transition-opacity"}>
                <p className="text-2xl font-semibold tabular-nums">
                  {converted != null ? formatConverted(converted, to) : "—"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {from === to
                    ? "Misma moneda"
                    : effectiveRate != null
                      ? `1 ${from} = ${effectiveRate.toFixed(4)} ${to}`
                      : "—"}
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
