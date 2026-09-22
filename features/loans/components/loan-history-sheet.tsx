"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { HistoryIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { RowActionsMenu } from "@/components/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  type LoanDirection,
  type LoanMovementRow,
} from "@/features/loans/types/loan-types";
import { formatCurrency } from "@/lib/format";

type LoanHistorySheetProps = {
  personName: string;
  direction: LoanDirection;
  movements: LoanMovementRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (movement: LoanMovementRow) => void;
  onDelete: (movement: LoanMovementRow) => void;
};

function formatLoanDate(value: string) {
  return format(new Date(`${value}T12:00:00`), "d MMM yyyy", { locale: es });
}

function movementLabel(movement: LoanMovementRow) {
  if (movement.kind === "payment") {
    return movement.direction === "lent" ? "Devolución" : "Pago";
  }
  return movement.direction === "lent" ? "Presté" : "Me prestaron";
}

function isIncoming(movement: LoanMovementRow) {
  return movement.kind === "payment"
    ? movement.direction === "lent"
    : movement.direction === "borrowed";
}

function movementBadgeClass(movement: LoanMovementRow) {
  return isIncoming(movement)
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : "bg-destructive/10 text-destructive";
}

function matchesQuery(movement: LoanMovementRow, term: string) {
  return [
    movement.description,
    movement.notes,
    movementLabel(movement),
    String(movement.amount),
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(term));
}

function HistoryMovementRow({
  movement,
  onEdit,
  onDelete,
}: {
  movement: LoanMovementRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const incoming = isIncoming(movement);

  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {formatLoanDate(movement.occurredOn)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge className={movementBadgeClass(movement)} variant="secondary">
            {movementLabel(movement)}
          </Badge>
          {movement.kind === "disbursement" && movement.interestRate > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {movement.interestRate}% mensual
            </span>
          )}
        </div>
        {movement.description && (
          <p className="mt-1 line-clamp-2 text-sm">{movement.description}</p>
        )}
        {movement.notes && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground italic">
            {movement.notes}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-start gap-1">
        <span
          className={`pt-0.5 text-sm font-semibold tabular-nums ${
            incoming
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive"
          }`}
        >
          {incoming ? "+" : "-"}
          {formatCurrency(movement.amount, movement.currency)}
        </span>
        <RowActionsMenu
          editLabel="Editar movimiento"
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}

export function LoanHistorySheet({
  personName,
  direction,
  movements,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: LoanHistorySheetProps) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const visibleMovements = useMemo(
    () =>
      term
        ? movements.filter((movement) => matchesQuery(movement, term))
        : movements,
    [movements, term],
  );

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-4 py-4 pr-12">
          <SheetTitle>{personName}</SheetTitle>
          <SheetDescription>
            {direction === "lent" ? "Yo presté" : "Me prestaron"} ·{" "}
            {visibleMovements.length}
            {term ? ` de ${movements.length}` : ""} movimiento
            {movements.length !== 1 ? "s" : ""}
          </SheetDescription>
        </SheetHeader>
        <div className="border-b p-4">
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-sm"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar"
              value={query}
            />
          </div>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-4">
            {visibleMovements.length === 0 ? (
              <Empty className="bg-muted/20">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HistoryIcon />
                  </EmptyMedia>
                  <EmptyTitle>
                    {term ? "Sin resultados" : "Sin movimientos"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {term
                      ? "Prueba con otro motivo, nota o monto."
                      : "Los préstamos y abonos de esta persona aparecerán aquí."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col">
                {visibleMovements.map((movement, index) => (
                  <div
                    className="flex flex-col"
                    key={`${movement.kind}-${movement.id}`}
                  >
                    {index > 0 && <Separator />}
                    <HistoryMovementRow
                      movement={movement}
                      onDelete={() => onDelete(movement)}
                      onEdit={() => onEdit(movement)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
