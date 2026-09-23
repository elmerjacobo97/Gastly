"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ReceiptTextIcon } from "lucide-react";

import { RowActionsMenu } from "@/components/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { type DataTableFeatures } from "@/components/ui/data-table";
import { type LoanMovementRow } from "@/features/loans/types/loan-types";
import { formatCurrency, formatDate } from "@/lib/format";

type LoanDisbursementsColumnsOptions = {
  onPay: (movement: LoanMovementRow) => void;
  onEdit: (movement: LoanMovementRow) => void;
  onDelete: (movement: LoanMovementRow) => void;
};

function directionLabel(direction: LoanMovementRow["direction"]) {
  return direction === "lent" ? "Yo presté" : "Me prestaron";
}

function isIncoming(movement: LoanMovementRow) {
  return movement.direction === "borrowed";
}

export function createLoanDisbursementsColumns({
  onPay,
  onEdit,
  onDelete,
}: LoanDisbursementsColumnsOptions): ColumnDef<
  DataTableFeatures,
  LoanMovementRow
>[] {
  return [
    {
      accessorKey: "occurredOn",
      enableGlobalFilter: false,
      header: "Fecha",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.occurredOn)}
        </span>
      ),
    },
    {
      accessorKey: "personName",
      header: "Persona",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.personName}</span>
      ),
    },
    {
      accessorFn: (row) => directionLabel(row.direction),
      id: "direction",
      enableGlobalFilter: false,
      header: "Tipo",
      cell: ({ row }) => (
        <Badge
          className={
            row.original.direction === "lent"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive"
          }
          variant="secondary"
        >
          {directionLabel(row.original.direction)}
        </Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Motivo",
      cell: ({ row }) => (
        <span className="block max-w-56 truncate text-muted-foreground">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      enableGlobalFilter: false,
      enableSorting: false,
      header: () => <div className="text-right">Prestado</div>,
      cell: ({ row }) => {
        const movement = row.original;
        const incoming = isIncoming(movement);
        return (
          <div
            className={
              incoming
                ? "text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
                : "text-right font-medium tabular-nums text-destructive"
            }
          >
            {formatCurrency(movement.amount, movement.currency)}
            {movement.interestRate > 0 && (
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                {movement.interestRate}% mensual
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "pendingAmount",
      enableGlobalFilter: false,
      enableSorting: false,
      header: () => <div className="text-right">Pendiente</div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold tabular-nums">
          {formatCurrency(row.original.pendingAmount, row.original.currency)}
        </div>
      ),
    },
    {
      id: "actions",
      size: 48,
      cell: ({ row }) => {
        const movement = row.original;
        const additionalActions = [
          {
            icon: <ReceiptTextIcon />,
            label:
              movement.direction === "lent"
                ? "Registrar devolución"
                : "Registrar pago",
            onSelect: () => onPay(movement),
          },
        ];

        return (
          <div className="flex justify-end">
            <RowActionsMenu
              additionalActions={additionalActions}
              className="text-muted-foreground data-[state=open]:bg-muted"
              editLabel="Editar préstamo"
              onDelete={() => onDelete(movement)}
              onEdit={() => onEdit(movement)}
            />
          </div>
        );
      },
    },
  ];
}
