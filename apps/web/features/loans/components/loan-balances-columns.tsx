"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { HistoryIcon, PlusIcon } from "lucide-react";

import { RowActionsMenu } from "@/components/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { type DataTableFeatures } from "@/components/ui/data-table";
import { type Loan } from "@/features/loans/types/loan-types";
import { formatCurrency } from "@/lib/format";

type LoanBalancesColumnsOptions = {
  onAdd: (loan: Loan) => void;
  onEdit: (loan: Loan) => void;
  onHistory: (loan: Loan) => void;
  onDelete: (loan: Loan) => void;
};

function directionLabel(direction: Loan["direction"]) {
  return direction === "lent" ? "Yo presté" : "Me prestaron";
}

function LoanPersonCell({ loan }: { loan: Loan }) {
  return (
    <div className="flex min-w-32 flex-col">
      <span className="font-medium">{loan.personName}</span>
      {loan.notes && (
        <span className="max-w-48 truncate text-xs text-muted-foreground">
          {loan.notes}
        </span>
      )}
    </div>
  );
}

function LoanPendingCell({ loan }: { loan: Loan }) {
  if (loan.isSettled) {
    return <Badge variant="secondary">Saldado</Badge>;
  }

  return (
    <span
      className={
        loan.direction === "lent"
          ? "font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
          : "font-medium tabular-nums text-destructive"
      }
    >
      {formatCurrency(loan.pendingAmount, loan.currency)}
    </span>
  );
}

export function createLoanBalancesColumns({
  onAdd,
  onEdit,
  onHistory,
  onDelete,
}: LoanBalancesColumnsOptions): ColumnDef<DataTableFeatures, Loan>[] {
  return [
    {
      accessorKey: "personName",
      header: "Persona",
      cell: ({ row }) => <LoanPersonCell loan={row.original} />,
    },
    {
      accessorFn: (row) => directionLabel(row.direction),
      id: "direction",
      enableGlobalFilter: false,
      header: "Tipo",
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={
            row.original.direction === "lent"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive"
          }
        >
          {directionLabel(row.original.direction)}
        </Badge>
      ),
    },
    {
      accessorKey: "pendingAmount",
      enableGlobalFilter: false,
      enableSorting: false,
      header: () => <div className="text-right">Pendiente</div>,
      cell: ({ row }) => {
        const loan = row.original;
        return (
          <div className="text-right">
            <LoanPendingCell loan={loan} />
            {loan.accruedInterest > 0 && (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Incluye {formatCurrency(loan.accruedInterest, loan.currency)} de
                interés
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      size: 48,
      cell: ({ row }) => {
        const loan = row.original;
        const additionalActions = [
          {
            icon: <PlusIcon />,
            label: "Otro préstamo",
            onSelect: () => onAdd(loan),
          },
          {
            icon: <HistoryIcon />,
            label: "Ver historial",
            onSelect: () => onHistory(loan),
          },
        ];

        return (
          <div className="flex justify-end">
            <RowActionsMenu
              additionalActions={additionalActions}
              className="text-muted-foreground data-[state=open]:bg-muted"
              editLabel="Editar persona"
              onDelete={() => onDelete(loan)}
              onEdit={() => onEdit(loan)}
            />
          </div>
        );
      },
    },
  ];
}
