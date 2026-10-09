"use client";

import { ReceiptTextIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { RowActionsMenu } from "@/components/row-actions-menu";
import { StatusBadge } from "@/components/status-badge";
import { TableSearchInput } from "@/components/table-search-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoanDueDate } from "@/features/loans/components/loan-due-date";
import { type LoanMovementRow } from "@/features/loans/types/loan-types";
import { formatCurrency, formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/search";

type LoanDisbursementsTableProps = {
  disbursements: LoanMovementRow[];
  onPay: (movement: LoanMovementRow) => void;
  onEdit: (movement: LoanMovementRow) => void;
  onDelete: (movement: LoanMovementRow) => void;
};

function directionLabel(direction: LoanMovementRow["direction"]) {
  return direction === "lent" ? "Yo presté" : "Me prestaron";
}

export function LoanDisbursementsTable({
  disbursements,
  onPay,
  onEdit,
  onDelete,
}: LoanDisbursementsTableProps) {
  const [query, setQuery] = useState("");

  const visibleDisbursements = useMemo(
    () =>
      disbursements.filter((movement) =>
        matchesQuery(query, movement.personName, movement.description),
      ),
    [disbursements, query],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Préstamos pendientes</CardTitle>
        <CardDescription>
          {disbursements.length} préstamo
          {disbursements.length !== 1 ? "s" : ""}
          {disbursements.length !== 1 ? " pendientes" : " pendiente"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <TableSearchInput value={query} onChange={setQuery} />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead>Persona</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Motivo</TableHead>
                <TableHead className="text-right">Prestado</TableHead>
                <TableHead className="hidden md:table-cell">
                  Devolución
                </TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleDisbursements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin resultados.
                  </TableCell>
                </TableRow>
              ) : (
                visibleDisbursements.map((movement) => {
                  const incoming = movement.direction === "borrowed";
                  return (
                    <TableRow key={movement.id}>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {formatDate(movement.occurredOn)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.personName}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          tone={
                            movement.direction === "lent" ? "success" : "danger"
                          }
                        >
                          {directionLabel(movement.direction)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="block max-w-56 truncate text-muted-foreground">
                          {movement.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`font-medium tabular-nums ${
                            incoming
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-destructive"
                          }`}
                        >
                          {formatCurrency(movement.amount, movement.currency)}
                          {movement.interestRate > 0 && (
                            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                              {movement.interestRate}% mensual
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {movement.kind === "disbursement" && (
                          <LoanDueDate
                            expectedOn={movement.expectedOn}
                            isSettled={movement.isSettled}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(
                          movement.pendingAmount,
                          movement.currency,
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <RowActionsMenu
                            additionalActions={[
                              {
                                icon: <ReceiptTextIcon />,
                                label:
                                  movement.direction === "lent"
                                    ? "Registrar devolución"
                                    : "Registrar pago",
                                onSelect: () => onPay(movement),
                              },
                            ]}
                            className="text-muted-foreground data-[state=open]:bg-muted"
                            editLabel="Editar préstamo"
                            onDelete={() => onDelete(movement)}
                            onEdit={() => onEdit(movement)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
