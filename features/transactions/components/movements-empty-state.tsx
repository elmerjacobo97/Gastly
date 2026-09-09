"use client"

import { WalletCardsIcon } from "lucide-react"

import { CreateTransactionDialog } from "@/components/create-transaction-dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { transactionAddLabel } from "@/features/transactions/lib/movements-labels"
import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"
import { type Category } from "@/features/categories/types/category-types"

type MovementsEmptyStateProps = {
  typeFilter: "all" | TransactionType
  categories: Category[]
}

export function MovementsEmptyState({ typeFilter, categories }: MovementsEmptyStateProps) {
  const isIncome = typeFilter === "income"
  const isExpense = typeFilter === "expense"

  return (
    <Empty className="bg-muted/20">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WalletCardsIcon />
        </EmptyMedia>
        <EmptyTitle>
          {isIncome ? "Sin ingresos este mes" : isExpense ? "Sin gastos este mes" : "Sin transacciones este mes"}
        </EmptyTitle>
        <EmptyDescription>
          {isIncome
            ? "Registra tu primer ingreso para controlar tus entradas."
            : isExpense
              ? "Registra tu primer gasto para controlar tus egresos."
              : "Registra tu primer ingreso o gasto para ver el resumen."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <CreateTransactionDialog
          categories={categories}
          defaultType={isIncome ? "income" : "expense"}
          lockType={typeFilter !== "all"}
          triggerLabel={transactionAddLabel(typeFilter)}
        />
      </EmptyContent>
    </Empty>
  )
}
