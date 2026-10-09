"use client";

import { useState } from "react";

import { CategoryIconBadge } from "@/components/category-icon-badge";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { TableSearchInput } from "@/components/table-search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MovementsEmptyState } from "@/features/transactions/components/movements-empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { type Category } from "@/lib/category-types";
import { matchesQuery } from "@/lib/search";
import {
  type Transaction,
  type TransactionType,
} from "@/lib/transaction-types";

export type TypeFilter = "all" | TransactionType;

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
];

function TransactionDescriptionCell({
  transaction,
}: {
  transaction: Transaction;
}) {
  const isCreditCard = transaction.paymentMethod === "credit_card";
  const isPendingCC = isCreditCard && !transaction.creditCardPaidOn;

  return (
    <div className="flex max-w-64 flex-col whitespace-normal">
      <span className="font-medium">{transaction.description}</span>
      {isCreditCard && (
        <span
          className={`text-xs ${isPendingCC ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
        >
          TC
          {transaction.creditCardName ? ` · ${transaction.creditCardName}` : ""}
          {isPendingCC ? " · Por pagar" : " · Pagado"}
        </span>
      )}
      {transaction.notes && (
        <span className="truncate text-xs text-muted-foreground">
          {transaction.notes}
        </span>
      )}
    </div>
  );
}

function TransactionAmountCell({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === "income";
  return (
    <div
      className={`text-right font-medium tabular-nums ${
        isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
      }`}
    >
      {isIncome ? "+" : "-"}
      {formatCurrency(transaction.amount, transaction.currency)}
    </div>
  );
}

type MovementsTableProps = {
  rows: Transaction[];
  categories: Category[];
  typeFilter: TypeFilter;
  onTypeFilterChange: (value: TypeFilter) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
};

export function MovementsTable({
  rows,
  categories,
  typeFilter,
  onTypeFilterChange,
  onEdit,
  onDelete,
}: MovementsTableProps) {
  const [query, setQuery] = useState("");

  const visibleRows = rows.filter((transaction) =>
    matchesQuery(
      query,
      transaction.description,
      transaction.notes,
      transaction.category?.name,
      transaction.creditCardName,
    ),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <TableSearchInput value={query} onChange={setQuery} />
        <SegmentedControl
          value={typeFilter}
          onChange={onTypeFilterChange}
          options={TYPE_OPTIONS}
        />
      </div>

      {rows.length === 0 ? (
        <MovementsEmptyState typeFilter={typeFilter} categories={categories} />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="hidden md:table-cell">
                  Categoría
                </TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin resultados.
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <TransactionDescriptionCell transaction={transaction} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {transaction.category && (
                          <CategoryIconBadge
                            icon={transaction.category.icon}
                            color={transaction.category.color}
                            className="size-6 rounded-md"
                          />
                        )}
                        <span>
                          {transaction.category?.name ?? "Sin categoría"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDate(transaction.occurredOn)}
                    </TableCell>
                    <TableCell>
                      <TransactionAmountCell transaction={transaction} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <RowActionsMenu
                          onEdit={() => onEdit(transaction)}
                          onDelete={() => onDelete(transaction.id)}
                          className="text-muted-foreground data-[state=open]:bg-muted"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
