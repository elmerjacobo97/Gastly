"use client";

import { CheckCircle2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryIconBadge } from "@/components/category-icon-badge";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PayInstallmentsDialog } from "@/features/installments/components/pay-installments-dialog";
import {
  type InstallmentPayment,
  type InstallmentPurchase,
} from "@/lib/installment-types";
import { formatCurrency, formatDate } from "@/lib/format";

type MonthInstallment = {
  payment: InstallmentPayment;
  purchase: InstallmentPurchase;
};

type InstallmentMonthPaymentsCardProps = {
  monthPayments: MonthInstallment[];
  monthLabel: string;
  month: Date;
  onPay: (item: MonthInstallment) => void;
};

export function InstallmentMonthPaymentsCard({
  monthPayments,
  monthLabel,
  month,
  onPay,
}: InstallmentMonthPaymentsCardProps) {
  const pendingThisMonth = monthPayments.filter(
    ({ payment }) => !payment.transactionId && !payment.paidExternally,
  );
  const totalThisMonth = monthPayments.reduce(
    (s, { payment }) => s + payment.amount,
    0,
  );

  if (monthPayments.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base capitalize">
            Cuotas de {monthLabel}
          </CardTitle>
          <CardDescription>
            {monthPayments.length} cuota{monthPayments.length !== 1 ? "s" : ""}{" "}
            · {formatCurrency(totalThisMonth)}
          </CardDescription>
        </div>
        {pendingThisMonth.length > 0 && (
          <PayInstallmentsDialog pending={pendingThisMonth} month={month} />
        )}
        {pendingThisMonth.length === 0 && (
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2Icon className="size-4" />
            Todo pagado
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compra</TableHead>
                <TableHead className="hidden md:table-cell">Vence</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthPayments.map(({ payment, purchase }) => {
                const isPaid = !!(
                  payment.transactionId || payment.paidExternally
                );
                return (
                  <TableRow key={payment.id}>
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
                            Cuota {payment.paymentNumber}/
                            {purchase.totalInstallments}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDate(payment.dueOn)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {isPaid ? (
                          <StatusBadge tone="success">Pagado</StatusBadge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onPay({ payment, purchase })}
                          >
                            Pagar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
