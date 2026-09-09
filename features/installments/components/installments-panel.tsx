'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MonthNav } from '@/components/month-nav';
import { EditInstallmentDialog } from '@/features/installments/components/edit-installment-dialog';
import { InstallmentDialog } from '@/features/installments/components/installment-dialog';
import { InstallmentMonthPaymentsCard } from '@/features/installments/components/installment-month-payments-card';
import { InstallmentPurchaseSections } from '@/features/installments/components/installment-purchase-sections';
import { InstallmentsEmptyState } from '@/features/installments/components/installments-empty-state';
import { InstallmentsSummaryCards } from '@/features/installments/components/installments-summary-cards';
import { PaySingleInstallmentDialog } from '@/features/installments/components/pay-single-installment-dialog';
import { getMonthInstallments } from '@/features/installments/lib/installments-api';
import { deleteInstallmentPurchase } from '@/features/installments/server/actions';
import { type InstallmentPayment, type InstallmentPurchase } from '@/features/installments/types/installment-types';
import { type Account } from '@/features/accounts/types/account-types';
import { type Category } from '@/features/categories/types/category-types';

type InstallmentsPanelProps = {
  purchases: InstallmentPurchase[];
  accounts: Account[];
  categories: Category[];
  month: string;
};

export function InstallmentsPanel({ purchases, accounts, categories, month: monthStr }: InstallmentsPanelProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editPurchase, setEditPurchase] = useState<InstallmentPurchase | null>(null);
  const [payingItem, setPayingItem] = useState<{ payment: InstallmentPayment; purchase: InstallmentPurchase } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const month = useMemo(() => new Date(`${monthStr}-01T12:00:00`), [monthStr]);

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteInstallmentPurchase(id)
        toast.success('Compra eliminada')
        setDeleteId(null)
      } catch (error) {
        toast.error('No se pudo eliminar la compra', {
          description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
        })
      }
    })
  }

  const monthPayments = getMonthInstallments(purchases, month);
  const activePurchases = purchases.filter((p) => p.pendingCount > 0);
  const completedPurchases = purchases.filter((p) => p.pendingCount === 0);
  const monthLabel = format(month, 'MMMM yyyy', { locale: es });

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Cuotas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compras financiadas en tarjeta. El sistema genera y rastrea cada cuota.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav value={month} allowFuture />
          <InstallmentDialog accounts={accounts} categories={categories} />
        </div>
      </section>

      {purchases.length > 0 && <InstallmentsSummaryCards purchases={purchases} month={month} />}

      <InstallmentMonthPaymentsCard
        monthPayments={monthPayments}
        monthLabel={monthLabel}
        month={month}
        onPay={setPayingItem}
      />

      {purchases.length > 0 && monthPayments.length === 0 && (
        <div className="rounded-lg border border-muted px-4 py-3 text-sm text-muted-foreground">
          Sin cuotas programadas para <span className="capitalize">{monthLabel}</span>.
        </div>
      )}

      <InstallmentPurchaseSections
        activePurchases={activePurchases}
        completedPurchases={completedPurchases}
        onEdit={setEditPurchase}
        onDelete={setDeleteId}
      />

      {purchases.length === 0 && <InstallmentsEmptyState accounts={accounts} categories={categories} />}

      {editPurchase && (
        <EditInstallmentDialog
          purchase={editPurchase}
          accounts={accounts}
          categories={categories}
          open={Boolean(editPurchase)}
          onOpenChange={(o) => !o && setEditPurchase(null)}
        />
      )}

      {payingItem && (
        <PaySingleInstallmentDialog
          payment={payingItem.payment}
          purchase={payingItem.purchase}
          open={Boolean(payingItem)}
          onOpenChange={(o) => !o && setPayingItem(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        description="Se eliminará esta compra y todas sus cuotas permanentemente."
        pending={isPending}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </main>
  );
}
