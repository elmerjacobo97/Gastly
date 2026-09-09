'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, CheckCircle2Icon, CreditCardIcon, MoreHorizontalIcon, Trash2Icon } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import { MonthNav } from '@/components/month-nav';
import { CategoryIconBadge } from '@/components/category-icon-badge';
import { RowActionsMenu } from '@/components/row-actions-menu';
import { getMonthInstallments } from '@/features/installments/lib/installments-api';
import { deleteInstallmentPurchase } from '@/features/installments/server/actions';
import { type InstallmentPayment, type InstallmentPurchase } from '@/features/installments/types/installment-types';
import { EditInstallmentDialog } from '@/features/installments/components/edit-installment-dialog';
import { InstallmentDialog } from '@/features/installments/components/installment-dialog';
import { PayInstallmentsDialog } from '@/features/installments/components/pay-installments-dialog';
import { PaySingleInstallmentDialog } from '@/features/installments/components/pay-single-installment-dialog';
import { type Account } from '@/features/accounts/types/account-types';
import { type Category } from '@/features/categories/types/category-types';
import { formatCurrency, formatDate } from '@/lib/format';

type InstallmentsPanelProps = {
  purchases: InstallmentPurchase[];
  accounts: Account[];
  categories: Category[];
  month: string;
};

function InstallmentPurchaseSections({
  activePurchases,
  completedPurchases,
  onEdit,
  onDelete,
}: {
  activePurchases: InstallmentPurchase[]
  completedPurchases: InstallmentPurchase[]
  onEdit: (purchase: InstallmentPurchase) => void
  onDelete: (id: string) => void
}) {
  return (
    <>
      {activePurchases.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground">Compras activas ({activePurchases.length})</h2>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activePurchases.map((purchase) => {
              const pctPaid = purchase.totalInstallments > 0
                ? Math.round((purchase.paidCount / purchase.totalInstallments) * 100)
                : 0
              const nextPayment = purchase.payments.find(
                (payment) => !payment.transactionId && !payment.paidExternally
              )

              return (
                <Card key={purchase.id}>
                  <CardHeader className="flex flex-row items-start justify-between pb-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base">{purchase.description}</CardTitle>
                      <CardDescription className="mt-0.5 flex items-center gap-1.5">
                        {purchase.category && (
                          <CategoryIconBadge
                            icon={purchase.category.icon}
                            color={purchase.category.color}
                            className="size-4 rounded-sm"
                          />
                        )}
                        {purchase.totalInstallments} cuotas
                      </CardDescription>
                      <p className="mt-1 text-sm font-semibold tabular-nums">
                        {formatCurrency(purchase.installmentAmount)}/cuota
                      </p>
                    </div>
                    <RowActionsMenu
                      onEdit={() => onEdit(purchase)}
                      onDelete={() => onDelete(purchase.id)}
                      className="size-8 shrink-0 text-muted-foreground"
                    />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <Progress value={pctPaid} className="[&>div]:bg-primary" />
                    <div className="flex items-center justify-between text-xs tabular-nums">
                      <span className="text-muted-foreground">Pagado: <span className="text-foreground">{formatCurrency(purchase.totalPaid)}</span></span>
                      <span className="font-medium">Total: {formatCurrency(purchase.totalPaid + purchase.totalPending)}</span>
                      <span className="text-muted-foreground">Pendiente: <span className="text-foreground">{formatCurrency(purchase.totalPending)}</span></span>
                    </div>
                    {nextPayment && (
                      <p className="truncate text-xs text-muted-foreground">
                        Próxima cuota: <span className="font-medium text-foreground">{formatDate(nextPayment.dueOn)}</span>
                      </p>
                    )}
                    {purchase.account && (
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: purchase.account.color }} />
                        <span className="truncate text-xs text-muted-foreground">{purchase.account.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </section>
        </>
      )}
      {completedPurchases.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground">Compras saldadas ({completedPurchases.length})</h2>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {completedPurchases.map((purchase) => (
              <Card key={purchase.id} className="opacity-60">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">{purchase.description}</CardTitle>
                    <CardDescription>{purchase.totalInstallments} cuotas · {formatCurrency(purchase.totalPaid + purchase.totalPending)}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground">
                        <MoreHorizontalIcon />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onDelete(purchase.id)} className="text-destructive focus:text-destructive">
                        <Trash2Icon />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2Icon className="size-3.5" />
                    Saldado
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </>
      )}
    </>
  )
}

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
  const pendingThisMonth = monthPayments.filter(({ payment }) => !payment.transactionId && !payment.paidExternally);
  const paidThisMonth = monthPayments.filter(({ payment }) => payment.transactionId || payment.paidExternally);
  const totalThisMonth = monthPayments.reduce((s, { payment }) => s + payment.amount, 0);
  const totalPaidThisMonth = paidThisMonth.reduce((s, { payment }) => s + payment.amount, 0);

  const activePurchases = purchases.filter((p) => p.pendingCount > 0);
  const completedPurchases = purchases.filter((p) => p.pendingCount === 0);
  const totalPending = activePurchases.reduce((s, p) => s + p.totalPending, 0);

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

      {purchases.length > 0 && (
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
      )}

      {/* This month's payments */}
      {monthPayments.length > 0 && (
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
                    <div className="flex items-center gap-2 shrink-0">
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
                          onClick={() => setPayingItem({ payment, purchase })}
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
      )}

      {/* No payments this month */}
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

      {/* Empty state */}
      {purchases.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CreditCardIcon />
                </EmptyMedia>
                <EmptyTitle>Sin compras en cuotas</EmptyTitle>
                <EmptyDescription>
                  Registra una compra financiada para rastrear sus cuotas mensuales.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <InstallmentDialog accounts={accounts} categories={categories} triggerLabel="Registrar primera compra" />
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      )}

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
