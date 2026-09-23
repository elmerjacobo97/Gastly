const currencyFormatters = new Map<string, Intl.NumberFormat>()

function getFormatter(currency: string): Intl.NumberFormat {
  const cached = currencyFormatters.get(currency)
  if (cached) return cached
  const formatter = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
  })
  currencyFormatters.set(currency, formatter)
  return formatter
}

export function formatCurrency(value: number, currency: string = "PEN"): string {
  return getFormatter(currency).format(value)
}

export function formatDate(value: string): string {
  const d = new Date(`${value}T00:00:00`)
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function writeJson(data: unknown): void {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`)
}

export function writeLine(text: string): void {
  process.stdout.write(`${text}\n`)
}

export function writeError(text: string): void {
  process.stderr.write(`Error: ${text}\n`)
}
