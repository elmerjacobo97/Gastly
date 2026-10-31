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
import { formatCurrency } from "@/lib/format";
import { AccountLabel } from "@/components/account-label";
import { DateCell } from "@/components/date-cell";
import { StatusBadge } from "@/components/status-badge";
import { type Account } from "@/lib/account-types";
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
  return (
    <div className="flex min-w-44 max-w-64 flex-col whitespace-normal">
      <div className="flex items-center gap-1.5">
        <span
          className="line-clamp-2 font-medium break-words"
          title={transaction.description}
        >
          {transaction.description}
        </span>
        {transaction.recurringExpenseId && (
          <StatusBadge tone="muted">Recurrente</StatusBadge>
        )}
      </div>
      {transaction.notes && (
        <span
          className="line-clamp-1 text-xs break-words text-muted-foreground"
          title={transaction.notes}
        >
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
      {transaction.accountAmount !== null && (
        <div className="text-xs font-normal text-muted-foreground">
          {formatCurrency(transaction.accountAmount)} en cuenta
        </div>
      )}
    </div>
  );
}

type MovementsTableProps = {
  rows: Transaction[];
  categories: Category[];
  accounts: Account[];
  typeFilter: TypeFilter;
  onTypeFilterChange: (value: TypeFilter) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
};

export function MovementsTable({
  rows,
  categories,
  accounts,
  typeFilter,
  onTypeFilterChange,
  onEdit,
  onDelete,
}: MovementsTableProps) {
  const [query, setQuery] = useState("");
  const accountsById = new Map(accounts.map((a) => [a.id, a]));

  const visibleRows = rows.filter((transaction) =>
    matchesQuery(
      query,
      transaction.description,
      transaction.notes,
      transaction.category?.name,
      accountsById.get(transaction.accountId ?? "")?.name,
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
        <MovementsEmptyState
          typeFilter={typeFilter}
          categories={categories}
          accounts={accounts}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="sticky right-0 w-12 bg-card">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
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
                    <TableCell>
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
                    <TableCell>
                      <AccountLabel
                        account={accountsById.get(transaction.accountId ?? "")}
                      />
                    </TableCell>
                    <TableCell>
                      <DateCell value={transaction.occurredOn} />
                    </TableCell>
                    <TableCell>
                      <TransactionAmountCell transaction={transaction} />
                    </TableCell>
                    <TableCell className="sticky right-0 bg-card shadow-[-8px_0_8px_-8px_rgb(0_0_0/0.15)] [tr:hover>&]:bg-muted">
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
