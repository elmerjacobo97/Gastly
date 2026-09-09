export type CurrencyCode = "PEN" | "USD" | "MXN"

const currencyFormatters = new Map<string, Intl.NumberFormat>()

function getCurrencyFormatter(currency: CurrencyCode) {
  const cached = currencyFormatters.get(currency)
  if (cached) return cached
  const formatter = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
  })
  currencyFormatters.set(currency, formatter)
  return formatter
}

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export function formatCurrency(value: number, currency: CurrencyCode = "PEN") {
  return getCurrencyFormatter(currency).format(value)
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00`))
}
