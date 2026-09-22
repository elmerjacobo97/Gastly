"use client";

import { useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable, type DataTableFeatures } from "@/components/ui/data-table";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { createLoanBalancesColumns } from "@/features/loans/components/loan-balances-columns";
import { type Loan } from "@/features/loans/types/loan-types";
import { type ColumnDef } from "@tanstack/react-table";

type LoanFilter = "all" | "lent" | "borrowed" | "settled";

const LOAN_FILTER_OPTIONS: { value: LoanFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "lent", label: "Yo presté" },
  { value: "borrowed", label: "Me prestaron" },
  { value: "settled", label: "Saldadas" },
];

type LoanBalancesTableProps = {
  loans: Loan[];
  onAdd: (loan: Loan) => void;
  onEdit: (loan: Loan) => void;
  onHistory: (loan: Loan) => void;
  onDelete: (loan: Loan) => void;
};

export function LoanBalancesTable({
  loans,
  onAdd,
  onEdit,
  onHistory,
  onDelete,
}: LoanBalancesTableProps) {
  const [filter, setFilter] = useState<LoanFilter>("all");

  const filteredLoans = useMemo(() => {
    if (filter === "all") return loans;
    if (filter === "settled") return loans.filter((loan) => loan.isSettled);
    return loans.filter((loan) => loan.direction === filter);
  }, [filter, loans]);

  const columns = useMemo<ColumnDef<DataTableFeatures, Loan>[]>(
    () => createLoanBalancesColumns({ onAdd, onEdit, onHistory, onDelete }),
    [onAdd, onDelete, onEdit, onHistory],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Deudas</CardTitle>
        <CardDescription>
          {filteredLoans.length} saldo
          {filteredLoans.length !== 1 ? "s" : ""} registrado
          {filteredLoans.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={filteredLoans}
          searchPlaceholder="Buscar"
          toolbar={
            <SegmentedControl
              onChange={setFilter}
              options={LOAN_FILTER_OPTIONS}
              value={filter}
            />
          }
        />
      </CardContent>
    </Card>
  );
}
