"use client";

import { CopyIcon, EyeIcon, MessageCircleIcon, PlusIcon } from "lucide-react";
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
import { netLabel } from "@/features/loans/lib/group-loans";
import {
  type LoanCurrency,
  type LoanPersonGroup,
} from "@/features/loans/types/loan-types";
import { formatCurrency } from "@/lib/format";
import { matchesQuery } from "@/lib/search";

type PersonFilter = "all" | "owed" | "owe" | "settled";

const PERSON_FILTER_OPTIONS: { value: PersonFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "owed", label: "Me deben" },
  { value: "owe", label: "Debo" },
  { value: "settled", label: "Saldadas" },
];

function matchesFilter(group: LoanPersonGroup, filter: PersonFilter) {
  if (filter === "settled") return group.isSettled;
  if (filter === "owed") return group.totals.some((total) => total.net > 0);
  if (filter === "owe") return group.totals.some((total) => total.net < 0);
  return true;
}

function nextExpectedOn(group: LoanPersonGroup) {
  return (
    group.balances
      .filter((loan) => !loan.isSettled && loan.expectedOn)
      .map((loan) => loan.expectedOn!)
      .toSorted()[0] ?? null
  );
}

function openSaleAmount(group: LoanPersonGroup, currency: LoanCurrency) {
  return group.balances
    .filter((loan) => loan.currency === currency)
    .flatMap((loan) => loan.disbursements)
    .filter((disbursement) => disbursement.isSale)
    .reduce((sum, disbursement) => sum + disbursement.outstandingAmount, 0);
}

function PersonCell({
  group,
  onOpen,
}: {
  group: LoanPersonGroup;
  onOpen: () => void;
}) {
  return (
    <div className="flex min-w-28 flex-col items-start">
      <button
        className="font-medium hover:underline"
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
        type="button"
      >
        {group.personName}
      </button>
      <LoanDueDate
        expectedOn={nextExpectedOn(group)}
        isSettled={group.isSettled}
      />
    </div>
  );
}

function netClass(net: number) {
  if (net > 0) return "text-emerald-600 dark:text-emerald-400";
  if (net < 0) return "text-destructive";
  return "text-muted-foreground";
}

// Same hues as the "Le prestaste" / "Te prestó" badges in the person panel.
const SIDE_CLASSES = {
  lent: "text-sky-700 dark:text-sky-400",
  borrowed: "text-amber-700 dark:text-amber-400",
} as const;

function SideCell({
  group,
  side,
}: {
  group: LoanPersonGroup;
  side: "lent" | "borrowed";
}) {
  const totals = group.totals.filter((total) => total[side] > 0);
  if (totals.length === 0) {
    return <span className="block text-right text-muted-foreground">—</span>;
  }

  return (
    <div
      className={`flex flex-col items-end gap-0.5 font-medium tabular-nums ${SIDE_CLASSES[side]}`}
    >
      {totals.map((total) => {
        const saleAmount =
          side === "lent" ? openSaleAmount(group, total.currency) : 0;
        return (
          <span className="flex flex-col items-end" key={total.currency}>
            {formatCurrency(total[side], total.currency)}
            {saleAmount > 0 && (
              <span className="text-xs font-normal text-violet-700 dark:text-violet-400">
                {saleAmount === total[side]
                  ? "Venta"
                  : `Venta ${formatCurrency(saleAmount, total.currency)}`}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function NetCell({ group }: { group: LoanPersonGroup }) {
  if (group.totals.length === 0) {
    return (
      <div className="flex justify-end">
        <StatusBadge tone="muted">Saldado</StatusBadge>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5 text-right">
      {group.totals.map((total) => (
        <span
          className={`font-semibold tabular-nums ${netClass(total.net)}`}
          key={total.currency}
        >
          {netLabel(total)}
        </span>
      ))}
    </div>
  );
}

type LoanBalancesTableProps = {
  groups: LoanPersonGroup[];
  onAdd: (group: LoanPersonGroup) => void;
  onOpen: (group: LoanPersonGroup) => void;
  onEdit: (group: LoanPersonGroup) => void;
  onCopyStatement: (group: LoanPersonGroup) => void;
  onShareStatement: (group: LoanPersonGroup) => void;
  onDelete: (group: LoanPersonGroup) => void;
};

export function LoanBalancesTable({
  groups,
  onAdd,
  onOpen,
  onEdit,
  onCopyStatement,
  onShareStatement,
  onDelete,
}: LoanBalancesTableProps) {
  const [filter, setFilter] = useState<PersonFilter>("all");
  const [query, setQuery] = useState("");

  const visibleGroups = useMemo(
    () =>
      groups
        .filter(
          (group) =>
            matchesFilter(group, filter) &&
            matchesQuery(query, group.personName),
        )
        .toSorted((a, b) => Number(a.isSettled) - Number(b.isSettled)),
    [filter, groups, query],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Personas</CardTitle>
        <CardDescription>
          {visibleGroups.length}{" "}
          {visibleGroups.length === 1 ? "persona" : "personas"} · toca una para
          ver sus movimientos
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TableSearchInput value={query} onChange={setQuery} />
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={PERSON_FILTER_OPTIONS}
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead className="text-right">Me debe</TableHead>
                <TableHead className="text-right">Le debo</TableHead>
                <TableHead className="text-right">Saldo neto</TableHead>
                <TableHead className="sticky right-0 w-12 bg-card">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleGroups.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin resultados.
                  </TableCell>
                </TableRow>
              ) : (
                visibleGroups.map((group) => (
                  <TableRow
                    className={`cursor-pointer ${group.isSettled ? "opacity-60" : ""}`}
                    key={group.key}
                    onClick={() => onOpen(group)}
                  >
                    <TableCell>
                      <PersonCell group={group} onOpen={() => onOpen(group)} />
                    </TableCell>
                    <TableCell>
                      <SideCell group={group} side="lent" />
                    </TableCell>
                    <TableCell>
                      <SideCell group={group} side="borrowed" />
                    </TableCell>
                    <TableCell>
                      <NetCell group={group} />
                    </TableCell>
                    <TableCell
                      onClick={(event) => event.stopPropagation()}
                      className="sticky right-0 bg-card shadow-[-8px_0_8px_-8px_rgb(0_0_0/0.15)] [tr:hover>&]:bg-muted"
                    >
                      <div className="flex justify-end">
                        <RowActionsMenu
                          additionalActions={[
                            {
                              icon: <PlusIcon />,
                              label: "Registrar préstamo",
                              onSelect: () => onAdd(group),
                            },
                            {
                              icon: <EyeIcon />,
                              label: "Ver movimientos",
                              onSelect: () => onOpen(group),
                            },
                            {
                              icon: <CopyIcon />,
                              label: "Copiar estado de cuenta",
                              onSelect: () => onCopyStatement(group),
                              separatorBefore: true,
                            },
                            {
                              icon: <MessageCircleIcon />,
                              label: "Enviar por WhatsApp",
                              onSelect: () => onShareStatement(group),
                            },
                          ]}
                          className="text-muted-foreground data-[state=open]:bg-muted"
                          editLabel="Editar persona"
                          onDelete={() => onDelete(group)}
                          onEdit={() => onEdit(group)}
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
