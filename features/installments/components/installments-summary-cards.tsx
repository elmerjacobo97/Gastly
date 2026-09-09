'use client';

import { CreditCardIcon, CheckCircle2Icon, CalendarIcon } from 'lucide-react';

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { type InstallmentPurchase } from '@/features/installments/types/installment-types';
import { getMonthInstallments } from '@/features/installments/lib/installments-api';

type InstallmentsSummaryCardsProps = {
  purchases: InstallmentPurchase[];
  month: Date;
};

export function InstallmentsSummaryCards({ purchases, month }: InstallmentsSummaryCardsProps) {
  const monthPayments = getMonthInstallments(purchases, month);
  const paidThisMonth = monthPayments.filter(({ payment }) => payment.transactionId || payment.paidExternally);
  const totalThisMonth = monthPayments.reduce((s, { payment }) => s + payment.amount, 0);
  const totalPaidThisMonth = paidThisMonth.reduce((s, { payment }) => s + payment.amount, 0);
  const activePurchases = purchases.filter((p) => p.pendingCount > 0);
  const totalPending = activePurchases.reduce((s, p) => s + p.totalPending, 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Pendiente total</CardTitle>
          <CardAction>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <CreditCardIcon className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {activePurchases.length} compra{activePurchases.length !== 1 ? 's' : ''} activa{activePurchases.length !== 1 ? 's' : ''}
          </p>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalPending)}</p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Cuotas de este mes</CardTitle>
          <CardAction>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CalendarIcon className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {monthPayments.length} cuota{monthPayments.length !== 1 ? 's' : ''}
          </p>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalThisMonth)}</p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Pagado este mes</CardTitle>
          <CardAction>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <CheckCircle2Icon className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {paidThisMonth.length} cuota{paidThisMonth.length !== 1 ? 's' : ''}
          </p>
          <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalPaidThisMonth)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
