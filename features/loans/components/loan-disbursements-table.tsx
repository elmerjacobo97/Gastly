"use client";

import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable, type DataTableFeatures } from "@/components/ui/data-table";
import { createLoanDisbursementsColumns } from "@/features/loans/components/loan-disbursements-columns";
import { type LoanMovementRow } from "@/features/loans/types/loan-types";

type LoanDisbursementsTableProps = {
  disbursements: LoanMovementRow[];
  onPay: (movement: LoanMovementRow) => void;
  onEdit: (movement: LoanMovementRow) => void;
  onDelete: (movement: LoanMovementRow) => void;
};

export function LoanDisbursementsTable({
  disbursements,
  onPay,
  onEdit,
  onDelete,
}: LoanDisbursementsTableProps) {
  const columns = useMemo<ColumnDef<DataTableFeatures, LoanMovementRow>[]>(
    () => createLoanDisbursementsColumns({ onPay, onEdit, onDelete }),
    [onDelete, onEdit, onPay],
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
      <CardContent>
        <DataTable
          columns={columns}
          data={disbursements}
          searchPlaceholder="Buscar"
        />
      </CardContent>
    </Card>
  );
}
