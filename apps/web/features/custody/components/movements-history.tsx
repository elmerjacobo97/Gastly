"use client";

import { PackageIcon } from "lucide-react";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { METHOD_LABELS } from "@/features/custody/components/create-movement-dialog";
import { flattenCustodyMovements } from "@/features/custody/lib/custody-api";
import {
  type CustodyMovementRow,
  type CustodyOrder,
} from "@/features/custody/types/custody-types";
import { formatCurrency, formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/search";

type MovementsHistoryProps = {
  orders: CustodyOrder[];
  onEditMovement: (movement: CustodyMovementRow) => void;
  onDeleteMovement: (movementId: string) => void;
};

function methodLabel(method: string | null) {
  return method ? (METHOD_LABELS[method] ?? method) : null;
}

export function MovementsHistory({
  orders,
  onEditMovement,
  onDeleteMovement,
}: MovementsHistoryProps) {
  const [query, setQuery] = useState("");

  const movements = useMemo(() => {
    const all = flattenCustodyMovements(orders);
    return all.toSorted(
      (a, b) =>
        new Date(`${b.occurredOn}T12:00:00`).getTime() -
        new Date(`${a.occurredOn}T12:00:00`).getTime(),
    );
  }, [orders]);

  const visibleMovements = useMemo(
    () =>
      movements.filter((movement) =>
        matchesQuery(
          query,
          movement.personName,
          movement.orderTitle,
          movement.notes,
          methodLabel(movement.method),
        ),
      ),
    [movements, query],
  );

  const totals = movements.reduce(
    (acc, m) => {
      if (m.type === "deposit") acc.deposited += m.amount;
      else acc.disbursed += m.amount;
      return acc;
    },
    { deposited: 0, disbursed: 0 },
  );
  const balance = totals.deposited - totals.disbursed;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Historial de movimientos</CardTitle>
        <CardDescription>
          Todos los encargos · {movements.length} movimiento
          {movements.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {movements.length > 0 && (
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total entradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totals.deposited)}
                </p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total salidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold tabular-nums text-destructive">
                  {formatCurrency(totals.disbursed)}
                </p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  En custodia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(balance)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {movements.length === 0 ? (
          <Empty className="bg-muted/20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageIcon />
              </EmptyMedia>
              <EmptyTitle>Sin movimientos</EmptyTitle>
              <EmptyDescription>
                Los depósitos y desembolsos aparecerán aquí.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            <TableSearchInput value={query} onChange={setQuery} />

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden md:table-cell">
                      Fecha
                    </TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Encargo</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Método
                    </TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Notas
                    </TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleMovements.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-sm text-muted-foreground"
                      >
                        Sin resultados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleMovements.map((movement) => {
                      const isDeposit = movement.type === "deposit";
                      return (
                        <TableRow key={movement.id}>
                          <TableCell className="hidden text-muted-foreground md:table-cell">
                            {formatDate(movement.occurredOn)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              tone={isDeposit ? "success" : "danger"}
                            >
                              {isDeposit ? "Depósito" : "Desembolso"}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {movement.personName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {movement.orderTitle}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">
                            {methodLabel(movement.method) ?? "—"}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium tabular-nums ${
                              isDeposit
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                            }`}
                          >
                            {isDeposit ? "+" : "-"}
                            {formatCurrency(movement.amount)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="block max-w-50 truncate text-muted-foreground">
                              {movement.notes || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <RowActionsMenu
                                onEdit={() => onEditMovement(movement)}
                                onDelete={() => onDeleteMovement(movement.id)}
                                className="text-muted-foreground data-[state=open]:bg-muted"
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
