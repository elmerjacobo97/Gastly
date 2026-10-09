"use client";

import { HistoryIcon, PlusIcon } from "lucide-react";
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
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoanDueDate } from "@/features/loans/components/loan-due-date";
import { type Loan } from "@/features/loans/types/loan-types";
import { formatCurrency } from "@/lib/format";
import { matchesQuery } from "@/lib/search";

type LoanFilter = "all" | "lent" | "borrowed" | "settled";

const LOAN_FILTER_OPTIONS: { value: LoanFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "lent", label: "Yo presté" },
  { value: "borrowed", label: "Me prestaron" },
  { value: "settled", label: "Saldadas" },
];

function directionLabel(direction: Loan["direction"]) {
  return direction === "lent" ? "Yo presté" : "Me prestaron";
}

function LoanPersonCell({ loan }: { loan: Loan }) {
  return (
    <div className="flex min-w-32 flex-col">
      <span className="font-medium">{loan.personName}</span>
      {loan.notes && (
        <span className="max-w-48 truncate text-xs text-muted-foreground">
          {loan.notes}
        </span>
      )}
      <LoanDueDate expectedOn={loan.expectedOn} isSettled={loan.isSettled} />
    </div>
  );
}

function LoanPendingCell({ loan }: { loan: Loan }) {
  if (loan.isSettled) {
    return <StatusBadge tone="muted">Saldado</StatusBadge>;
  }

  return (
    <div className="text-right">
      <span
        className={
          loan.direction === "lent"
            ? "font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
            : "font-medium tabular-nums text-destructive"
        }
      >
        {formatCurrency(loan.pendingAmount, loan.currency)}
      </span>
      {loan.accruedInterest > 0 && (
        <span className="mt-0.5 block text-xs text-muted-foreground">
          Incluye {formatCurrency(loan.accruedInterest, loan.currency)} de
          interés
        </span>
      )}
    </div>
  );
}

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
  const [query, setQuery] = useState("");

  const visibleLoans = useMemo(() => {
    const byFilter =
      filter === "all"
        ? loans
        : filter === "settled"
          ? loans.filter((loan) => loan.isSettled)
          : loans.filter((loan) => loan.direction === filter);

    return byFilter.filter((loan) =>
      matchesQuery(
        query,
        loan.personName,
        loan.notes,
        directionLabel(loan.direction),
      ),
    );
  }, [filter, loans, query]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Deudas</CardTitle>
        <CardDescription>
          {visibleLoans.length} saldo
          {visibleLoans.length !== 1 ? "s" : ""} registrado
          {visibleLoans.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TableSearchInput value={query} onChange={setQuery} />
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={LOAN_FILTER_OPTIONS}
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleLoans.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin resultados.
                  </TableCell>
                </TableRow>
              ) : (
                visibleLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <LoanPersonCell loan={loan} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={loan.direction === "lent" ? "success" : "danger"}
                      >
                        {directionLabel(loan.direction)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <LoanPendingCell loan={loan} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <RowActionsMenu
                          additionalActions={[
                            {
                              icon: <PlusIcon />,
                              label: "Otro préstamo",
                              onSelect: () => onAdd(loan),
                            },
                            {
                              icon: <HistoryIcon />,
                              label: "Ver historial",
                              onSelect: () => onHistory(loan),
                            },
                          ]}
                          className="text-muted-foreground data-[state=open]:bg-muted"
                          editLabel="Editar persona"
                          onDelete={() => onDelete(loan)}
                          onEdit={() => onEdit(loan)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
