export async function fetchExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1
  const res = await fetch(`https://open.er-api.com/v6/latest/${from}`)
  if (!res.ok) throw new Error("No se pudo obtener el tipo de cambio")
  const data = await res.json()
  if (data.result !== "success") throw new Error("No se pudo obtener el tipo de cambio")
  const rate = data.rates[to]
  if (rate == null) throw new Error(`Moneda ${to} no soportada`)
  return rate as number
}
