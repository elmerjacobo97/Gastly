"use client";

import {
  ArrowLeftRightIcon,
  CheckCircle2Icon,
  PackageIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ProgressCell } from "@/components/progress-cell";
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
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateMovementDialog } from "@/features/custody/components/create-movement-dialog";
import {
  type CustodyMovementType,
  type CustodyOrder,
} from "@/features/custody/types/custody-types";
import { formatCurrency, formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/search";

type OrderFilter = "active" | "closed" | "all";

type MovementTarget = { order: CustodyOrder; type: CustodyMovementType };

const FILTER_OPTIONS: { value: OrderFilter; label: string }[] = [
  { value: "active", label: "Activos" },
  { value: "closed", label: "Cerrados" },
  { value: "all", label: "Todos" },
];

type OrdersSectionProps = {
  orders: CustodyOrder[];
  onEdit: (order: CustodyOrder) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
};

export function OrdersSection({
  orders,
  onEdit,
  onDelete,
  onComplete,
}: OrdersSectionProps) {
  const [filter, setFilter] = useState<OrderFilter>("active");
  const [query, setQuery] = useState("");
  const [movement, setMovement] = useState<MovementTarget | null>(null);

  const activeCount = orders.filter(
    (order) => order.status === "active",
  ).length;
  const closedCount = orders.length - activeCount;

  const visibleOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          if (filter === "active") return order.status === "active";
          if (filter === "closed") return order.status !== "active";
          return true;
        })
        .filter((order) =>
          matchesQuery(query, order.personName, order.title, order.notes),
        ),
    [filter, orders, query],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Encargos registrados</CardTitle>
        <CardDescription>
          {activeCount} activo{activeCount !== 1 ? "s" : ""} · {closedCount}{" "}
          cerrado{closedCount !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TableSearchInput value={query} onChange={setQuery} />
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={FILTER_OPTIONS}
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Encargo</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Depositado
                </TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Devuelto
                </TableHead>
                <TableHead className="text-right">En custodia</TableHead>
                <TableHead className="hidden lg:table-cell">Estimado</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin resultados.
                  </TableCell>
                </TableRow>
              ) : (
                visibleOrders.map((order) => {
                  const isActive = order.status === "active";
                  const target = order.targetAmount ?? 0;
                  const progressAmount = Math.max(0, order.balanceHeld);
                  const pctProgress =
                    target > 0
                      ? Math.min(
                          100,
                          Math.round((progressAmount / target) * 100),
                        )
                      : null;

                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="max-w-48 truncate font-medium">
                              {order.personName}
                            </span>
                            {order.status === "completed" && (
                              <StatusBadge tone="muted">Completado</StatusBadge>
                            )}
                            {order.status === "cancelled" && (
                              <StatusBadge tone="muted">Cancelado</StatusBadge>
                            )}
                          </div>
                          <span className="max-w-64 truncate text-xs text-muted-foreground">
                            {order.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {pctProgress === null ? (
                          <span className="text-xs text-muted-foreground">
                            Sin objetivo
                          </span>
                        ) : (
                          <ProgressCell percent={pctProgress}>
                            {formatCurrency(progressAmount)} de{" "}
                            {formatCurrency(target)}
                          </ProgressCell>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-right text-muted-foreground tabular-nums md:table-cell">
                        {formatCurrency(order.totalDeposited)}
                      </TableCell>
                      <TableCell className="hidden text-right text-muted-foreground tabular-nums md:table-cell">
                        {formatCurrency(order.totalDisbursed)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(order.balanceHeld)}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {order.expectedOn ? formatDate(order.expectedOn) : "—"}
                      </TableCell>
                      <TableCell>
                        <RowActionsMenu
                          onEdit={() => onEdit(order)}
                          onDelete={() => onDelete(order.id)}
                          additionalActions={
                            isActive
                              ? [
                                  {
                                    icon: <ArrowLeftRightIcon />,
                                    label: "Registrar movimiento",
                                    onSelect: () =>
                                      setMovement({ order, type: "deposit" }),
                                  },
                                  {
                                    icon: <CheckCircle2Icon />,
                                    label: "Marcar completado",
                                    onSelect: () => onComplete(order.id),
                                  },
                                ]
                              : undefined
                          }
                          className="text-muted-foreground data-[state=open]:bg-muted"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {movement && (
          <CreateMovementDialog
            order={movement.order}
            type={movement.type}
            open
            onOpenChange={(open) => {
              if (!open) setMovement(null);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function EmptyOrders() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-dashed py-16 text-center border">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <PackageIcon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">No hay encargos registrados</p>
        <p className="text-sm text-muted-foreground">
          Registra dinero en custodia para llevar un historial de depósitos y
          desembolsos.
        </p>
      </div>
    </div>
  );
}
