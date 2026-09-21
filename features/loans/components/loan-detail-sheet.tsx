"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { AddLoanDialog } from "@/features/loans/components/add-loan-dialog";
import { EditLoanEventDialog } from "@/features/loans/components/edit-loan-event-dialog";
import { RecordPaymentDialog } from "@/features/loans/components/record-payment-dialog";
import {
  earliestLoanedOn,
  historyEntriesForGroup,
} from "@/features/loans/lib/group-loans";
import {
  deleteLoanDisbursement,
  deleteLoanPayment,
} from "@/features/loans/server/actions";
import {
  type Loan,
  type LoanHistoryEntry,
  type LoanPersonGroup,
} from "@/features/loans/types/loan-types";
import { formatCurrency } from "@/lib/format";

type LoanDetailSheetProps = {
  group: LoanPersonGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatLoanDate(value: string) {
  return format(new Date(`${value}T12:00:00`), "d MMM yyyy", { locale: es });
}

function directionLabel(group: LoanPersonGroup) {
  return group.direction === "lent" ? "Yo presté" : "Me prestaron";
}

function LoanBalance({
  loan,
  direction,
}: {
  loan: Loan;
  direction: LoanPersonGroup["direction"];
}) {
  const paidPercentage =
    loan.amount > 0
      ? Math.min(100, Math.round((loan.paidAmount / loan.amount) * 100))
      : 0;

  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base tabular-nums">
            {formatCurrency(
              loan.isSettled ? loan.amount : loan.pendingAmount,
              loan.currency,
            )}
          </CardTitle>
          <CardDescription>
            {loan.isSettled ? "Saldo saldado" : "Pendiente"}
          </CardDescription>
        </div>
        <Badge variant={loan.isSettled ? "secondary" : "outline"}>
          {loan.currency}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <Progress value={paidPercentage} />
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground tabular-nums">
          <span>Abonado {formatCurrency(loan.paidAmount, loan.currency)}</span>
          <span>Total {formatCurrency(loan.amount, loan.currency)}</span>
        </div>
        {loan.expectedOn && (
          <p className="text-xs text-muted-foreground">
            {direction === "lent" ? "Devolución esperada" : "Pagar antes del"}:{" "}
            {formatLoanDate(loan.expectedOn)}
          </p>
        )}
        {loan.notes && (
          <p className="text-xs text-muted-foreground italic">{loan.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryEntryRow({
  entry,
  direction,
  onEdit,
  onDelete,
}: {
  entry: LoanHistoryEntry;
  direction: LoanPersonGroup["direction"];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPayment = entry.kind === "payment";

  return (
    <div className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {formatLoanDate(entry.occurredOn)}
        </p>
        <p className="text-xs text-muted-foreground">
          {isPayment
            ? "Abono"
            : direction === "borrowed"
              ? "Me prestaron"
              : "Presté"}{" "}
          · {entry.currency}
        </p>
        {entry.notes && (
          <p className="mt-0.5 text-xs text-muted-foreground italic">
            {entry.notes}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-start gap-1">
        <span
          className={`pt-0.5 text-sm font-semibold tabular-nums ${
            isPayment
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground"
          }`}
        >
          {isPayment ? "+" : ""}
          {formatCurrency(entry.amount, entry.currency)}
        </span>
        <RowActionsMenu
          onEdit={onEdit}
          onDelete={onDelete}
          editLabel="Editar monto"
        />
      </div>
    </div>
  );
}

export function LoanDetailSheet({
  group,
  open,
  onOpenChange,
}: LoanDetailSheetProps) {
  const entries = historyEntriesForGroup(group);
  const pendingBalances = group.balances.filter((loan) => !loan.isSettled);
  const [editEntry, setEditEntry] = useState<LoanHistoryEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<LoanHistoryEntry | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(entry: LoanHistoryEntry) {
    startTransition(async () => {
      try {
        if (entry.kind === "payment") {
          await deleteLoanPayment(entry.id);
          toast.success("Abono eliminado");
        } else {
          await deleteLoanDisbursement(entry.id);
          toast.success("Préstamo eliminado del historial");
        }
        setDeleteEntry(null);
      } catch (error) {
        toast.error("No se pudo eliminar", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b px-4 py-4 pr-12">
            <SheetTitle>{group.personName}</SheetTitle>
            <SheetDescription>
              {directionLabel(group)} · desde{" "}
              {formatLoanDate(earliestLoanedOn(group))}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-6 p-4">
              <section className="flex flex-col gap-3">
                <div>
                  <h3 className="text-sm font-medium">Saldos</h3>
                  <p className="text-xs text-muted-foreground">
                    {group.balances.length} moneda
                    {group.balances.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {group.balances.map((loan) => (
                  <LoanBalance
                    key={loan.id}
                    loan={loan}
                    direction={group.direction}
                  />
                ))}
              </section>

              <section className="flex flex-col gap-3">
                <div>
                  <h3 className="text-sm font-medium">Historial</h3>
                  <p className="text-xs text-muted-foreground">
                    {entries.length} movimiento{entries.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {entries.length === 0 ? (
                  <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    Sin movimientos registrados aún.
                  </p>
                ) : (
                  <div className="rounded-xl border px-4">
                    <div className="flex flex-col divide-y">
                      {entries.map((entry) => (
                        <HistoryEntryRow
                          key={`${entry.kind}-${entry.id}`}
                          entry={entry}
                          direction={group.direction}
                          onEdit={() => setEditEntry(entry)}
                          onDelete={() => setDeleteEntry(entry)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>

          <SheetFooter className="border-t p-4">
            <div className="flex w-full flex-wrap gap-2">
              <AddLoanDialog group={group} />
              {pendingBalances.length > 0 && (
                <RecordPaymentDialog
                  personName={group.personName}
                  balances={pendingBalances}
                />
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {editEntry && (
        <EditLoanEventDialog
          entry={editEntry}
          open={!!editEntry}
          onOpenChange={(next) => !next && setEditEntry(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteEntry)}
        onOpenChange={(next) => !next && setDeleteEntry(null)}
        description={
          deleteEntry?.kind === "payment"
            ? "Se eliminará este abono y el pendiente se recalculará."
            : "Se eliminará este préstamo del historial y el saldo se recalculará."
        }
        pending={isPending}
        onConfirm={() => deleteEntry && handleDelete(deleteEntry)}
      />
    </>
  );
}
