"use client";

import { HistoryIcon, PauseCircleIcon, PlayCircleIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { AccountLabel } from "@/components/account-label";
import { CategoryIconBadge } from "@/components/category-icon-badge";
import { DateCell } from "@/components/date-cell";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { StatusBadge } from "@/components/status-badge";
import { TableSearchInput } from "@/components/table-search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  formatFrequency,
  getPaymentBadge,
} from "@/features/recurring-payments/lib/recurring-payment-helpers";
import { type RecurringPayment } from "@/lib/recurring-payment-types";
import { dueTone } from "@/lib/due-tone";
import { formatCurrency } from "@/lib/format";
import { matchesQuery } from "@/lib/search";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | RecurringPayment["type"];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
];

function dueDateTone(payment: RecurringPayment) {
  if (!payment.isActive || payment.paidOn) return "muted";
  return dueTone(payment.nextDueOn);
}

function amountLabel(payment: RecurringPayment) {
  const value =
    payment.paidAmount === null
      ? formatCurrency(payment.amount, payment.currency)
      : formatCurrency(
          payment.paidAmount,
          payment.paidCurrency ?? payment.currency,
        );
  return payment.type === "income" ? `+${value}` : value;
}

type RecurringPaymentListProps = {
  payments: RecurringPayment[];
  monthKey: string;
  onPay: (payment: RecurringPayment) => void;
  onEdit: (payment: RecurringPayment) => void;
  onHistory: (payment: RecurringPayment) => void;
  onToggle: (payment: RecurringPayment) => void;
  onDelete: (id: string) => void;
};

export function RecurringPaymentList({
  payments,
  monthKey,
  onPay,
  onEdit,
  onHistory,
  onToggle,
  onDelete,
}: RecurringPaymentListProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");

  const visiblePayments = useMemo(
    () =>
      payments
        .filter(
          (payment) => typeFilter === "all" || payment.type === typeFilter,
        )
        .filter((payment) =>
          matchesQuery(
            query,
            payment.description,
            payment.category?.name,
            payment.account?.name,
          ),
        ),
    [payments, query, typeFilter],
  );

  if (payments.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pagos y cobros</CardTitle>
        <CardDescription>
          {payments.length} registro{payments.length !== 1 ? "s" : ""} este mes
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TableSearchInput value={query} onChange={setQuery} />
          <SegmentedControl
            value={typeFilter}
            onChange={setTypeFilter}
            options={TYPE_OPTIONS}
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Último pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="sticky right-0 w-28 bg-card">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiblePayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin resultados.
                  </TableCell>
                </TableRow>
              ) : (
                visiblePayments.map((payment) => {
                  const badge = getPaymentBadge(payment, monthKey);
                  const canPay = payment.isActive && !payment.paidOn;
                  const isIncome = payment.type === "income";

                  return (
                    <TableRow
                      key={payment.id}
                      className={cn(!payment.isActive && "opacity-60")}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {payment.category && (
                            <CategoryIconBadge
                              icon={payment.category.icon}
                              color={payment.category.color}
                              className="size-8 shrink-0 rounded-lg"
                            />
                          )}
                          <div className="flex min-w-0 flex-col">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="line-clamp-2 max-w-56 font-medium whitespace-normal break-words"
                                title={payment.description}
                              >
                                {payment.description}
                              </span>
                              {isIncome && (
                                <StatusBadge tone="success">
                                  Ingreso
                                </StatusBadge>
                              )}
                            </div>
                            {payment.category && (
                              <span className="text-xs text-muted-foreground">
                                {payment.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-muted-foreground">
                          <span>{formatFrequency(payment)}</span>
                          <span className="text-xs">
                            {payment.paymentKind === "fixed"
                              ? "Monto fijo"
                              : "Monto variable"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <AccountLabel account={payment.account} />
                      </TableCell>
                      <TableCell>
                        <DateCell
                          value={payment.nextDueOn}
                          tone={dueDateTone(payment)}
                        />
                      </TableCell>
                      <TableCell>
                        <DateCell value={payment.paidOn} tone="done" />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={badge.variant}
                          className={badge.className}
                        >
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          isIncome && "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {amountLabel(payment)}
                      </TableCell>
                      <TableCell className="sticky right-0 bg-card shadow-[-8px_0_8px_-8px_rgb(0_0_0/0.15)] [tr:hover>&]:bg-muted">
                        <div className="flex items-center justify-end gap-1">
                          {canPay && (
                            <Button size="sm" onClick={() => onPay(payment)}>
                              {isIncome ? "Cobrar" : "Pagar"}
                            </Button>
                          )}
                          <RowActionsMenu
                            onEdit={() => onEdit(payment)}
                            onDelete={() => onDelete(payment.id)}
                            additionalActions={[
                              {
                                icon: <HistoryIcon />,
                                label: "Historial de pagos",
                                onSelect: () => onHistory(payment),
                              },
                              {
                                icon: payment.isActive ? (
                                  <PauseCircleIcon />
                                ) : (
                                  <PlayCircleIcon />
                                ),
                                label: payment.isActive ? "Pausar" : "Activar",
                                onSelect: () => onToggle(payment),
                              },
                            ]}
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
