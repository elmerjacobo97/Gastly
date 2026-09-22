"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AddLoanDialog } from "@/features/loans/components/add-loan-dialog";
import { EditLoanDialog } from "@/features/loans/components/edit-loan-dialog";
import { EditLoanEventDialog } from "@/features/loans/components/edit-loan-event-dialog";
import { LoanBalancesTable } from "@/features/loans/components/loan-balances-table";
import { LoanDisbursementsTable } from "@/features/loans/components/loan-disbursements-table";
import { LoanHistorySheet } from "@/features/loans/components/loan-history-sheet";
import { RecordPaymentDialog } from "@/features/loans/components/record-payment-dialog";
import {
  flattenLoanMovements,
  groupLoansByPerson,
  normalizePersonName,
} from "@/features/loans/lib/group-loans";
import {
  deleteLoanBalances,
  deleteLoanDisbursement,
  deleteLoanPayment,
} from "@/features/loans/server/actions";
import {
  type Loan,
  type LoanDirection,
  type LoanMovementRow,
  type LoanPersonGroup,
} from "@/features/loans/types/loan-types";

type LoansWorkspaceProps = {
  loans: Loan[];
};

type HistoryContext = {
  personName: string;
  direction: LoanDirection;
};

export function LoansWorkspace({ loans }: LoansWorkspaceProps) {
  const [isMutationPending, startTransition] = useTransition();
  const [addGroup, setAddGroup] = useState<LoanPersonGroup | null>(null);
  const [editGroup, setEditGroup] = useState<LoanPersonGroup | null>(null);
  const [paymentMovement, setPaymentMovement] =
    useState<LoanMovementRow | null>(null);
  const [historyContext, setHistoryContext] = useState<HistoryContext | null>(
    null,
  );
  const [editMovement, setEditMovement] = useState<LoanMovementRow | null>(
    null,
  );
  const [deleteLoan, setDeleteLoan] = useState<Loan | null>(null);
  const [deleteMovement, setDeleteMovement] = useState<LoanMovementRow | null>(
    null,
  );
  const groups = groupLoansByPerson(loans);
  const allMovements = flattenLoanMovements(loans);
  const disbursements = allMovements.filter(
    (movement) => movement.kind === "disbursement" && !movement.isSettled,
  );
  const historyMovements = historyContext
    ? allMovements.filter(
        (movement) =>
          movement.direction === historyContext.direction &&
          normalizePersonName(movement.personName) ===
            normalizePersonName(historyContext.personName),
      )
    : [];
  const liveAddGroup = addGroup
    ? (groups.find((group) => group.key === addGroup.key) ?? null)
    : null;
  const liveEditGroup = editGroup
    ? (groups.find((group) => group.key === editGroup.key) ?? null)
    : null;
  function findGroupForLoan(loan: Loan) {
    return groups.find((group) =>
      group.balances.some((balance) => balance.id === loan.id),
    );
  }

  function openAddDialog(loan: Loan) {
    const group = findGroupForLoan(loan);
    if (group) setAddGroup(group);
  }

  function openEditDialog(loan: Loan) {
    const group = findGroupForLoan(loan);
    if (group) setEditGroup(group);
  }

  function openMovementPayment(movement: LoanMovementRow) {
    if (movement.kind === "disbursement" && !movement.isSettled) {
      setPaymentMovement(movement);
    }
  }

  function handleDeleteLoan(loan: Loan) {
    startTransition(async () => {
      try {
        await deleteLoanBalances([loan.id]);
        toast.success("Saldo eliminado");
        setDeleteLoan(null);
      } catch (error) {
        toast.error("No se pudo eliminar el saldo", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  function handleDeleteMovement(movement: LoanMovementRow) {
    startTransition(async () => {
      try {
        if (movement.kind === "payment") {
          await deleteLoanPayment(movement.id);
          toast.success("Abono eliminado");
        } else {
          await deleteLoanDisbursement(movement.id);
          toast.success("Movimiento eliminado");
        }
        setDeleteMovement(null);
      } catch (error) {
        toast.error("No se pudo eliminar el movimiento", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  return (
    <>
      <LoanBalancesTable
        loans={loans}
        onAdd={openAddDialog}
        onDelete={setDeleteLoan}
        onEdit={openEditDialog}
        onHistory={(loan) =>
          setHistoryContext({
            personName: loan.personName,
            direction: loan.direction,
          })
        }
      />

      <LoanDisbursementsTable
        disbursements={disbursements}
        onDelete={setDeleteMovement}
        onEdit={setEditMovement}
        onPay={openMovementPayment}
      />

      {historyContext && (
        <LoanHistorySheet
          direction={historyContext.direction}
          movements={historyMovements}
          onDelete={setDeleteMovement}
          onEdit={setEditMovement}
          onOpenChange={(open) => !open && setHistoryContext(null)}
          open
          personName={historyContext.personName}
        />
      )}

      {liveAddGroup && (
        <AddLoanDialog
          group={liveAddGroup}
          onOpenChange={(open) => !open && setAddGroup(null)}
          open
        />
      )}

      {liveEditGroup && (
        <EditLoanDialog
          group={liveEditGroup}
          open
          onOpenChange={(open) => !open && setEditGroup(null)}
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
        open={Boolean(deleteLoan)}
        onOpenChange={(open) => !open && setDeleteLoan(null)}
        description="Se eliminará este saldo y todo su historial de préstamos y abonos en esta moneda."
        pending={isMutationPending}
        onConfirm={() => deleteLoan && handleDeleteLoan(deleteLoan)}
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
