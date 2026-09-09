import { format } from "date-fns"

import { type AccountTransfer } from "@/features/accounts/types/account-types"

export function exportTransfersCSV(transfers: AccountTransfer[], filename: string) {
  const headers = ["Fecha", "Origen", "Destino", "Monto", "Notas"]
  const rows = transfers.map((t) => [
    t.occurredOn,
    t.fromAccountName,
    t.toAccountName,
    t.amount.toString(),
    t.notes ?? "",
  ])
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function transfersCsvFilename() {
  return `gastly-transferencias-${format(new Date(), "yyyy-MM-dd")}.csv`
}
