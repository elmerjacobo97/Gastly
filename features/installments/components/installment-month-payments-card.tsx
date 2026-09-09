'use client';

import { CheckCircle2Icon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryIconBadge } from '@/components/category-icon-badge';
import { PayInstallmentsDialog } from '@/features/installments/components/pay-installments-dialog';
import { type InstallmentPayment, type InstallmentPurchase } from '@/features/installments/types/installment-types';
import { formatCurrency, formatDate } from '@/lib/format';

type MonthInstallment = { payment: InstallmentPayment; purchase: InstallmentPurchase };

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
  const pendingThisMonth = monthPayments.filter(({ payment }) => !payment.transactionId && !payment.paidExternally);
  const totalThisMonth = monthPayments.reduce((s, { payment }) => s + payment.amount, 0);

  if (monthPayments.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base capitalize">Cuotas de {monthLabel}</CardTitle>
          <CardDescription>
            {monthPayments.length} cuota{monthPayments.length !== 1 ? 's' : ''} · {formatCurrency(totalThisMonth)}
          </CardDescription>
        </div>
        {pendingThisMonth.length > 0 && <PayInstallmentsDialog pending={pendingThisMonth} month={month} />}
        {pendingThisMonth.length === 0 && (
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2Icon className="size-4" />
            Todo pagado
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col divide-y">
          {monthPayments.map(({ payment, purchase }) => {
            const isPaid = !!(payment.transactionId || payment.paidExternally);
            return (
              <div key={payment.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                {purchase.category && (
                  <CategoryIconBadge
                    icon={purchase.category.icon}
                    color={purchase.category.color}
                    className="size-8 shrink-0 rounded-lg"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{purchase.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Cuota {payment.paymentNumber}/{purchase.totalInstallments} · {formatDate(payment.dueOn)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(payment.amount)}</span>
                  {isPaid ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      Pagado
                    </Badge>
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
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
