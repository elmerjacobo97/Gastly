"use client";

import { useMemo, useState } from "react";

import { CategoryIconBadge } from "@/components/category-icon-badge";
import { ProgressCell } from "@/components/progress-cell";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TableSearchInput } from "@/components/table-search-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDisplayInstallment } from "@/lib/installments-calcs";
import { type InstallmentPurchase } from "@/lib/installment-types";
import { formatCurrency, formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/search";

type PurchaseFilter = "active" | "completed" | "all";

const FILTER_OPTIONS: { value: PurchaseFilter; label: string }[] = [
  { value: "active", label: "Activas" },
  { value: "completed", label: "Saldadas" },
  { value: "all", label: "Todas" },
];

type InstallmentPurchasesTableProps = {
  purchases: InstallmentPurchase[];
  month: Date;
  onEdit: (purchase: InstallmentPurchase) => void;
  onDelete: (id: string) => void;
};

export function InstallmentPurchasesTable({
  purchases,
  month,
  onEdit,
  onDelete,
}: InstallmentPurchasesTableProps) {
  const [filter, setFilter] = useState<PurchaseFilter>("active");
  const [query, setQuery] = useState("");

  const activeCount = purchases.filter((p) => p.pendingCount > 0).length;
  const completedCount = purchases.length - activeCount;

  const visiblePurchases = useMemo(
    () =>
      purchases
        .filter((purchase) => {
          if (filter === "active") return purchase.pendingCount > 0;
          if (filter === "completed") return purchase.pendingCount === 0;
          return true;
        })
        .filter((purchase) =>
          matchesQuery(
            query,
            purchase.description,
            purchase.category?.name,
            purchase.account?.name,
          ),
        ),
    [filter, purchases, query],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Compras</CardTitle>
        <CardDescription>
          {activeCount} activa{activeCount !== 1 ? "s" : ""} · {completedCount}{" "}
          saldada{completedCount !== 1 ? "s" : ""}
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
                <TableHead>Compra</TableHead>
                <TableHead className="hidden md:table-cell">Cuenta</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Cuota
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Próxima cuota
                </TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiblePurchases.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin resultados.
                  </TableCell>
                </TableRow>
              ) : (
                visiblePurchases.map((purchase) => {
                  const isCompleted = purchase.pendingCount === 0;
                  const pctPaid =
                    purchase.totalInstallments > 0
                      ? Math.round(
                          (purchase.paidCount / purchase.totalInstallments) *
                            100,
                        )
                      : 0;
                  const nextPayment = isCompleted
                    ? null
                    : getDisplayInstallment(purchase, month);

                  return (
                    <TableRow
                      key={purchase.id}
                      className={isCompleted ? "opacity-60" : undefined}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {purchase.category && (
                            <CategoryIconBadge
                              icon={purchase.category.icon}
                              color={purchase.category.color}
                              className="size-6 shrink-0 rounded-md"
                            />
                          )}
                          <div className="flex min-w-0 flex-col">
                            <span className="max-w-64 truncate font-medium">
                              {purchase.description}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {purchase.totalInstallments} cuotas
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {purchase.account && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor: purchase.account.color,
                              }}
                            />
                            {purchase.account.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <ProgressCell percent={pctPaid}>
                          {isCompleted
                            ? "Saldado"
                            : `${purchase.paidCount}/${purchase.totalInstallments} · ${pctPaid}%`}
                        </ProgressCell>
                      </TableCell>
                      <TableCell className="hidden text-right font-medium tabular-nums md:table-cell">
                        {formatCurrency(purchase.installmentAmount)}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {nextPayment
                          ? `Cuota ${nextPayment.paymentNumber}/${purchase.totalInstallments} · ${formatDate(nextPayment.dueOn)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(purchase.totalPending)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <RowActionsMenu
                            onEdit={
                              isCompleted ? undefined : () => onEdit(purchase)
                            }
                            onDelete={() => onDelete(purchase.id)}
                            className="text-muted-foreground data-[state=open]:bg-muted"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
