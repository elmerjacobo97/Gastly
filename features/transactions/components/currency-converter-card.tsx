"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowLeftRightIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { NumberInput } from "@/components/ui/number-input"
import { Skeleton } from "@/components/ui/skeleton"
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

export function CurrencyConverterCard() {
  const [amount, setAmount] = useState<number>(100)
  const [from, setFrom] = useState<Currency>("USD")
  const [to, setTo] = useState<Currency>("PEN")

  const { data: rate, isLoading, isError, refetch } = useQuery({
    queryKey: ["exchange-rate", from, to],
    queryFn: () => fetchExchangeRate(from, to),
    enabled: from !== to,
    staleTime: 1000 * 60 * 60,
  })

  const effectiveRate = from === to ? 1 : rate
  const converted = effectiveRate != null && amount > 0 ? amount * effectiveRate : null

  function swap() {
    setFrom(to)
    setTo(from)
  }

  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">Conversor de moneda</p>

      <div className="mt-2 flex items-center gap-2">
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
          <span className="sr-only">Intercambiar monedas</span>
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

      <div className="mt-1.5">
        {isLoading && from !== to ? (
          <>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="mt-1 h-3 w-32" />
          </>
        ) : isError ? (
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
          <>
            <p className="text-xl font-semibold tabular-nums">
              {converted != null ? formatConverted(converted, to) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {from === to
                ? "Misma moneda"
                : effectiveRate != null
                  ? `1 ${from} = ${effectiveRate.toFixed(4)} ${to}`
                  : "—"}
            </p>
          </>
        )}
      </div>
    </Card>
  )
}
