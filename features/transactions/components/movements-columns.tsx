"use client"

import { type ColumnDef } from "@tanstack/react-table"

import { CategoryIconBadge } from "@/components/category-icon-badge"
import { RowActionsMenu } from "@/components/row-actions-menu"
import { type Transaction } from "@/features/transactions/types/transaction-types"
import { formatCurrency, formatDate } from "@/lib/format"
import { type DataTableFeatures } from "@/components/ui/data-table"

function TransactionDescriptionCell({ transaction }: { transaction: Transaction }) {
  const isCreditCard = transaction.paymentMethod === "credit_card"
  const isPendingCC = isCreditCard && !transaction.creditCardPaidOn

  return (
    <div className="flex flex-col">
      <span className="font-medium">{transaction.description}</span>
      {isCreditCard && (
        <span className={`text-xs ${isPendingCC ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
          TC{transaction.creditCardName ? ` · ${transaction.creditCardName}` : ""}
          {isPendingCC ? " · Por pagar" : " · Pagado"}
        </span>
      )}
      {transaction.notes && (
        <span className="truncate text-xs text-muted-foreground">{transaction.notes}</span>
      )}
    </div>
  )
}

function TransactionAmountCell({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === "income"
  return (
    <div
      className={`text-right font-medium tabular-nums ${
        isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
      }`}
    >
      {isIncome ? "+" : "-"}
      {formatCurrency(transaction.amount)}
    </div>
  )
}

type MovementsColumnsOptions = {
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

export function createMovementsColumns({
  onEdit,
  onDelete,
}: MovementsColumnsOptions): ColumnDef<DataTableFeatures, Transaction>[] {
  return [
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => <TransactionDescriptionCell transaction={row.original} />,
    },
    {
      accessorFn: (row) => row.category?.name ?? "Sin categoría",
      id: "category",
      header: "Categoría",
      cell: ({ row, getValue }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          {row.original.category && (
            <CategoryIconBadge
              icon={row.original.category.icon}
              color={row.original.category.color}
              className="size-6 rounded-md"
            />
          )}
          <span>{getValue() as string}</span>
        </div>
      ),
    },
    {
      accessorKey: "occurredOn",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.getValue("occurredOn"))}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      enableSorting: false,
      header: () => <div className="text-right">Monto</div>,
      cell: ({ row }) => <TransactionAmountCell transaction={row.original} />,
    },
    {
      id: "actions",
      size: 48,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <RowActionsMenu
            onEdit={() => onEdit(row.original)}
            onDelete={() => onDelete(row.original.id)}
            className="text-muted-foreground data-[state=open]:bg-muted"
          />
        </div>
      ),
    },
  ]
}
