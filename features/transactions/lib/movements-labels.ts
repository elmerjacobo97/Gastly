import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"

type MovementsTypeFilter = "all" | TransactionType

export function transactionAddLabel(typeFilter: MovementsTypeFilter) {
  if (typeFilter === "income") return "Nuevo ingreso"
  if (typeFilter === "expense") return "Nuevo gasto"
  return "Nueva transacción"
}

export function movementsCardTitle(typeFilter: MovementsTypeFilter) {
  if (typeFilter === "all") return "Todas las transacciones"
  return typeFilter === "expense" ? "Gastos" : "Ingresos"
}
