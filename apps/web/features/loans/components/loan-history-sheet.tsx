"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeftRightIcon,
  CopyIcon,
  HistoryIcon,
  MessageCircleIcon,
  Share2Icon,
  PlusIcon,
  ReceiptTextIcon,
  SearchIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { RowActionsMenu } from "@/components/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { netLabel } from "@/features/loans/lib/group-loans";
import {
  type Loan,
  type LoanMovementRow,
  type LoanPersonGroup,
} from "@/features/loans/types/loan-types";
import { formatCurrency } from "@/lib/format";

export type LoanOffset = {
  lent: Loan;
  borrowed: Loan;
  amount: number;
};

type LoanHistorySheetProps = {
  group: LoanPersonGroup;
  movements: LoanMovementRow[];
  onCopyStatement: () => void;
  onShareStatement: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
  onCompensate: (offset: LoanOffset) => void;
  onPay: (movement: LoanMovementRow) => void;
  onEdit: (movement: LoanMovementRow) => void;
  onDelete: (movement: LoanMovementRow) => void;
};

function formatLoanDate(value: string) {
  return format(new Date(`${value}T12:00:00`), "d MMM yyyy", { locale: es });
}

function movementLabel(movement: LoanMovementRow) {
  if (movement.kind === "payment") {
    if (movement.isSale) return "Te pagó";
    return movement.direction === "lent" ? "Te devolvió" : "Le devolviste";
  }
  if (movement.isSale) return "Le vendiste";
  return movement.direction === "lent" ? "Le prestaste" : "Te prestó";
}

function isIncoming(movement: LoanMovementRow) {
  return movement.kind === "payment"
    ? movement.direction === "lent"
    : movement.direction === "borrowed";
}

function isActive(movement: LoanMovementRow) {
  return movement.kind === "disbursement" && movement.pendingAmount > 0;
}

function movementBadgeClass(movement: LoanMovementRow) {
  if (movement.isSale) {
    return "bg-violet-500/10 text-violet-700 dark:text-violet-400";
  }
  if (movement.kind === "payment") {
    return movement.direction === "lent"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : "bg-rose-500/10 text-rose-700 dark:text-rose-400";
  }
  return movement.direction === "lent"
    ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
    : "bg-amber-500/10 text-amber-700 dark:text-amber-400";
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

function getOffsets(group: LoanPersonGroup): LoanOffset[] {
  return group.totals.flatMap((total) => {
    const open = (direction: Loan["direction"]) =>
      group.balances.find(
        (loan) =>
          !loan.isSettled &&
          loan.direction === direction &&
          loan.currency === total.currency,
      );
    const lent = open("lent");
    const borrowed = open("borrowed");
    if (!lent || !borrowed) return [];
    return [{ lent, borrowed, amount: Math.min(total.lent, total.borrowed) }];
  });
}

function HistoryMovementRow({
  movement,
  onPay,
  onEdit,
  onDelete,
}: {
  movement: LoanMovementRow;
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const incoming = isIncoming(movement);
  const isPending = isActive(movement);

  return (
    <div
      className={`flex items-start justify-between gap-3 py-3 ${
        isPending ? "" : "opacity-55"
      } ${movement.isSale ? "bg-violet-500/[0.03]" : ""}`}
    >
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
        {movement.kind === "payment" && movement.notes && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground italic">
            {movement.notes}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-start gap-1">
        <div className="pt-0.5 text-right">
          <span
            className={`text-sm font-semibold tabular-nums ${
              incoming
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive"
            }`}
          >
            {incoming ? "+" : "-"}
            {formatCurrency(movement.amount, movement.currency)}
          </span>
          {movement.kind === "disbursement" && (
            <span className="block text-xs text-muted-foreground tabular-nums">
              {isPending
                ? `Pendiente ${formatCurrency(movement.pendingAmount, movement.currency)}`
                : "Pagado"}
            </span>
          )}
        </div>
        <RowActionsMenu
          additionalActions={
            isPending
              ? [
                  {
                    icon: <ReceiptTextIcon />,
                    label:
                      movement.direction === "lent"
                        ? "Registrar devolución"
                        : "Registrar pago",
                    onSelect: onPay,
                  },
                ]
              : undefined
          }
          editLabel="Editar movimiento"
          onDelete={onDelete}
          onEdit={isPending ? onEdit : undefined}
        />
      </div>
    </div>
  );
}

function MovementSection({
  title,
  movements,
  muted = false,
  onPay,
  onEdit,
  onDelete,
}: {
  title: string;
  muted?: boolean;
  movements: LoanMovementRow[];
  onPay: (movement: LoanMovementRow) => void;
  onEdit: (movement: LoanMovementRow) => void;
  onDelete: (movement: LoanMovementRow) => void;
}) {
  if (movements.length === 0) return null;

  return (
    <section
      className={`flex flex-col ${muted ? "rounded-lg border bg-muted/40 px-3 py-2.5" : ""}`}
    >
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title} · {movements.length}
      </h3>
      {movements.map((movement, index) => (
        <div className="flex flex-col" key={`${movement.kind}-${movement.id}`}>
          {index > 0 && <Separator />}
          <HistoryMovementRow
            movement={movement}
            onDelete={() => onDelete(movement)}
            onEdit={() => onEdit(movement)}
            onPay={() => onPay(movement)}
          />
        </div>
      ))}
    </section>
  );
}

export function LoanHistorySheet({
  group,
  movements,
  onCopyStatement,
  onShareStatement,
  open,
  onOpenChange,
  onAdd,
  onCompensate,
  onPay,
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
  const offsets = getOffsets(group);
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="pr-8">{group.personName}</SheetTitle>
          <SheetDescription className="pr-8">
            {group.totals.length === 0
              ? "Saldado"
              : group.totals.map(netLabel).join(" · ")}
          </SheetDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button onClick={onAdd} size="sm">
              <PlusIcon data-icon="inline-start" />
              Registrar préstamo
            </Button>
            {offsets.map((offset) => (
              <Button
                key={offset.lent.currency}
                onClick={() => onCompensate(offset)}
                size="sm"
                variant="outline"
              >
                <ArrowLeftRightIcon data-icon="inline-start" />
                Compensar {formatCurrency(offset.amount, offset.lent.currency)}
              </Button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Compartir estado de cuenta"
                  size="icon-sm"
                  variant="outline"
                >
                  <Share2Icon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-56">
                <DropdownMenuItem onSelect={onCopyStatement}>
                  <CopyIcon />
                  Copiar estado de cuenta
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onShareStatement}>
                  <MessageCircleIcon />
                  Enviar por WhatsApp
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                      : "Los préstamos y devoluciones de esta persona aparecerán aquí."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-6">
                <MovementSection
                  movements={visibleMovements.filter(isActive)}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onPay={onPay}
                  title="Pendientes"
                />
                <MovementSection
                  movements={visibleMovements.filter(
                    (movement) => !isActive(movement),
                  )}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onPay={onPay}
                  muted
                  title="Historial"
                />
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
