'use client';

import { CreditCardIcon, CheckCircle2Icon, CalendarIcon } from 'lucide-react';

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
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <CreditCardIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Pendiente total</p>
          <p className="truncate text-xs text-muted-foreground">{activePurchases.length} compra{activePurchases.length !== 1 ? 's' : ''} activa{activePurchases.length !== 1 ? 's' : ''}</p>
        </div>
        <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalPending)}</p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CalendarIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Cuotas de este mes</p>
          <p className="truncate text-xs text-muted-foreground">{monthPayments.length} cuota{monthPayments.length !== 1 ? 's' : ''}</p>
        </div>
        <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalThisMonth)}</p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <CheckCircle2Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">Pagado este mes</p>
          <p className="truncate text-xs text-muted-foreground">{paidThisMonth.length} cuota{paidThisMonth.length !== 1 ? 's' : ''}</p>
        </div>
        <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaidThisMonth)}</p>
      </div>
    </div>
  );
}
