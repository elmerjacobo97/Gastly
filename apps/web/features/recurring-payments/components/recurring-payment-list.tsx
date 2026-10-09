"use client";

import {
  CheckCircle2Icon,
  HistoryIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  ReceiptTextIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { CategoryIconBadge } from "@/components/category-icon-badge";
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
import { formatCurrency, formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/search";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | RecurringPayment["type"];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
];

function payButtonLabel(payment: RecurringPayment) {
  const isPaid = !!payment.paidOn;
  const isIncome = payment.type === "income";
  if (isPaid) return isIncome ? "Cobrado" : "Pagado";
  return isIncome ? "Cobrar" : "Pagar";
}

function dateLabel(payment: RecurringPayment) {
  const isIncome = payment.type === "income";
  if (payment.paidOn) {
    return `${isIncome ? "Cobrado" : "Pagado"} ${formatDate(payment.paidOn)}`;
  }
  return `${isIncome ? "Cobro" : "Vence"} ${formatDate(payment.nextDueOn)}`;
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
  pending: boolean;
  onPay: (payment: RecurringPayment) => void;
  onEdit: (payment: RecurringPayment) => void;
  onHistory: (payment: RecurringPayment) => void;
  onToggle: (payment: RecurringPayment) => void;
  onDelete: (id: string) => void;
};

export function RecurringPaymentList({
  payments,
  monthKey,
  pending,
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
                <TableHead className="hidden md:table-cell">
                  Frecuencia
                </TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="hidden sm:table-cell">Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Pago</span>
                </TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiblePayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin resultados.
                  </TableCell>
                </TableRow>
              ) : (
                visiblePayments.map((payment) => {
                  const badge = getPaymentBadge(payment, monthKey);
                  const isPaid = !!payment.paidOn;
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
                              <span className="max-w-56 truncate font-medium">
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
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col text-muted-foreground">
                          <span>{formatFrequency(payment)}</span>
                          {payment.account && (
                            <span
                              className="flex items-center gap-1.5 text-xs"
                              style={{ color: payment.account.color }}
                            >
                              {payment.account.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {dateLabel(payment)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          isIncome && "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {amountLabel(payment)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant={badge.variant}
                          className={badge.className}
                        >
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={isPaid ? "secondary" : "outline"}
                          disabled={!payment.isActive || isPaid || pending}
                          onClick={() => onPay(payment)}
                          className="h-8"
                        >
                          {isPaid ? (
                            <CheckCircle2Icon className="size-3.5" />
                          ) : (
                            <ReceiptTextIcon className="size-3.5" />
                          )}
                          {payButtonLabel(payment)}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
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
