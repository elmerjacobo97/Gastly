"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditLoanDialog } from "@/features/loans/components/edit-loan-dialog";
import { EditLoanEventDialog } from "@/features/loans/components/edit-loan-event-dialog";
import { LoanBalancesTable } from "@/features/loans/components/loan-balances-table";
import { LoanDialog } from "@/features/loans/components/loan-dialog";
import {
  LoanHistorySheet,
  type LoanOffset,
} from "@/features/loans/components/loan-history-sheet";
import { RecordPaymentDialog } from "@/features/loans/components/record-payment-dialog";
import { buildAccountStatement } from "@/features/loans/lib/account-statement";
import {
  flattenLoanMovements,
  groupLoansByPerson,
  normalizePersonName,
} from "@/features/loans/lib/group-loans";
import {
  compensateLoans,
  deleteLoanBalances,
  deleteLoanDisbursement,
  deleteLoanPayment,
} from "@/features/loans/server/actions";
import {
  type Loan,
  type LoanMovementRow,
  type LoanPersonGroup,
} from "@/features/loans/types/loan-types";
import { formatCurrency } from "@/lib/format";

type LoansWorkspaceProps = {
  loans: Loan[];
  ownerName: string;
};

export function LoansWorkspace({ loans, ownerName }: LoansWorkspaceProps) {
  const [isMutationPending, startTransition] = useTransition();
  const [addPersonName, setAddPersonName] = useState<string | null>(null);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<LoanPersonGroup | null>(null);
  const [offset, setOffset] = useState<LoanOffset | null>(null);
  const [paymentMovement, setPaymentMovement] =
    useState<LoanMovementRow | null>(null);
  const [editMovement, setEditMovement] = useState<LoanMovementRow | null>(
    null,
  );
  const [deleteMovement, setDeleteMovement] = useState<LoanMovementRow | null>(
    null,
  );
  const groups = groupLoansByPerson(loans);
  const detailGroup = groups.find((group) => group.key === detailKey) ?? null;
  const editGroup = groups.find((group) => group.key === editKey) ?? null;
  const detailMovements = detailGroup
    ? flattenLoanMovements(loans).filter(
        (movement) =>
          normalizePersonName(movement.personName) === detailGroup.key,
      )
    : [];

  function runMutation(
    action: () => Promise<void>,
    success: string,
    failure: string,
    onDone: () => void,
  ) {
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
        onDone();
      } catch (error) {
        toast.error(failure, {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  function statementFor(group: LoanPersonGroup) {
    return buildAccountStatement({
      group,
      movements: flattenLoanMovements(loans).filter(
        (movement) => normalizePersonName(movement.personName) === group.key,
      ),
      ownerName,
    });
  }

  async function copyStatement(group: LoanPersonGroup) {
    try {
      await navigator.clipboard.writeText(statementFor(group));
      toast.success("Estado de cuenta copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function shareStatement(group: LoanPersonGroup) {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(statementFor(group))}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function handleDeleteGroup(group: LoanPersonGroup) {
    runMutation(
      () => deleteLoanBalances(group.balances.map((loan) => loan.id)),
      "Persona eliminada",
      "No se pudo eliminar",
      () => setDeleteGroup(null),
    );
  }

  function handleCompensate({ lent, borrowed }: LoanOffset) {
    runMutation(
      () => compensateLoans(lent.id, borrowed.id),
      "Saldos compensados",
      "No se pudo compensar",
      () => setOffset(null),
    );
  }

  function handleDeleteMovement(movement: LoanMovementRow) {
    runMutation(
      () =>
        movement.kind === "payment"
          ? deleteLoanPayment(movement.id)
          : deleteLoanDisbursement(movement.id),
      movement.kind === "payment" ? "Abono eliminado" : "Movimiento eliminado",
      "No se pudo eliminar el movimiento",
      () => setDeleteMovement(null),
    );
  }

  return (
    <>
      <LoanBalancesTable
        groups={groups}
        onAdd={(group) => setAddPersonName(group.personName)}
        onDelete={setDeleteGroup}
        onCopyStatement={copyStatement}
        onEdit={(group) => setEditKey(group.key)}
        onShareStatement={shareStatement}
        onOpen={(group) => setDetailKey(group.key)}
      />

      {detailGroup && (
        <LoanHistorySheet
          group={detailGroup}
          movements={detailMovements}
          onCopyStatement={() => copyStatement(detailGroup)}
          onShareStatement={() => shareStatement(detailGroup)}
          onAdd={() => setAddPersonName(detailGroup.personName)}
          onCompensate={setOffset}
          onDelete={setDeleteMovement}
          onEdit={setEditMovement}
          onOpenChange={(open) => !open && setDetailKey(null)}
          onPay={setPaymentMovement}
          open
        />
      )}

      {addPersonName !== null && (
        <LoanDialog
          defaultPersonName={addPersonName}
          loans={loans}
          onOpenChange={(open) => !open && setAddPersonName(null)}
          open
        />
      )}

      {editGroup && (
        <EditLoanDialog
          group={editGroup}
          open
          onOpenChange={(open) => !open && setEditKey(null)}
        />
      )}

      {paymentMovement && (
        <RecordPaymentDialog
          movement={paymentMovement}
          onOpenChange={(open) => !open && setPaymentMovement(null)}
          open
        />
      )}

      {editMovement && (
        <EditLoanEventDialog
          entry={editMovement}
          onOpenChange={(open) => !open && setEditMovement(null)}
          open
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteGroup)}
        onOpenChange={(open) => !open && setDeleteGroup(null)}
        description="Se eliminarán todos los préstamos y devoluciones de esta persona."
        pending={isMutationPending}
        onConfirm={() => deleteGroup && handleDeleteGroup(deleteGroup)}
      />

      <ConfirmDialog
        open={Boolean(offset)}
        onOpenChange={(open) => !open && setOffset(null)}
        title="¿Compensar saldos?"
        description={
          offset
            ? `Se registrará una devolución de ${formatCurrency(offset.amount, offset.lent.currency)} en ambos lados y se saldará la deuda menor.`
            : ""
        }
        confirmLabel="Compensar"
        pending={isMutationPending}
        onConfirm={() => offset && handleCompensate(offset)}
      />

      <ConfirmDialog
        open={Boolean(deleteMovement)}
        onOpenChange={(open) => !open && setDeleteMovement(null)}
        description={
          deleteMovement?.kind === "payment"
            ? "Se eliminará este abono y el saldo pendiente se recalculará."
            : "Se eliminará este préstamo del movimiento y el saldo se recalculará."
        }
        pending={isMutationPending}
        onConfirm={() => deleteMovement && handleDeleteMovement(deleteMovement)}
      />
    </>
  );
}
