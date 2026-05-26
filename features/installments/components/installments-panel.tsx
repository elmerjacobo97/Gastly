'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, CheckCircle2Icon, ClockIcon, CreditCardIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { MonthNav } from '@/components/month-nav';
import { SummaryCard } from '@/components/summary-card';
import { CategoryIconBadge } from '@/features/categories/components/category-icon';
import {
  deleteInstallmentPurchase,
  getInstallmentPurchases,
  getMonthInstallments,
} from '@/features/installments/lib/installments-api';
import { type InstallmentPayment, type InstallmentPurchase } from '@/features/installments/types/installment-types';
import { EditInstallmentDialog } from '@/features/installments/components/edit-installment-dialog';
import { InstallmentDialog } from '@/features/installments/components/installment-dialog';
import { PayInstallmentsDialog } from '@/features/installments/components/pay-installments-dialog';
import { PaySingleInstallmentDialog } from '@/features/installments/components/pay-single-installment-dialog';
import { formatCurrency, formatDate } from '@/lib/format';

export function InstallmentsPanel() {
  const [month, setMonth] = useState(() => new Date());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editPurchase, setEditPurchase] = useState<InstallmentPurchase | null>(null);
  const [payingItem, setPayingItem] = useState<{ payment: InstallmentPayment; purchase: InstallmentPurchase } | null>(
    null
  );
  const queryClient = useQueryClient();

  const purchasesQuery = useQuery({
    queryKey: ['installments'],
    queryFn: getInstallmentPurchases,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInstallmentPurchase,
    onSuccess: async () => {
      setDeleteId(null);
      await queryClient.invalidateQueries({ queryKey: ['installments'] });
      toast.success('Compra eliminada');
    },
    onError: (error) => {
      toast.error('No se pudo eliminar', { description: error.message });
    },
  });

  const purchases = purchasesQuery.data ?? [];
  const monthPayments = getMonthInstallments(purchases, month);
  const pendingThisMonth = monthPayments.filter(({ payment }) => !payment.transactionId && !payment.paidExternally);
  const paidThisMonth = monthPayments.filter(({ payment }) => payment.transactionId || payment.paidExternally);
  const totalThisMonth = monthPayments.reduce((s, { payment }) => s + payment.amount, 0);
  const totalPendingThisMonth = pendingThisMonth.reduce((s, { payment }) => s + payment.amount, 0);
  const totalPaidThisMonth = paidThisMonth.reduce((s, { payment }) => s + payment.amount, 0);

  const activePurchases = purchases.filter((p) => p.pendingCount > 0);
  const completedPurchases = purchases.filter((p) => p.pendingCount === 0);
  const totalFinanced = purchases.reduce((s, p) => s + p.totalPaid + p.totalPending, 0);
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
          <MonthNav value={month} onChange={setMonth} allowFuture />
          <InstallmentDialog />
        </div>
      </section>

      {!purchasesQuery.isLoading && purchases.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Programado este mes"
            value={formatCurrency(totalThisMonth)}
            description={
              totalPendingThisMonth === 0
                ? `${monthPayments.length} cuota${monthPayments.length !== 1 ? 's' : ''} · todo pagado`
                : `${monthPayments.length} cuota${monthPayments.length !== 1 ? 's' : ''} del mes`
            }
            icon={CalendarIcon}
            variant={totalPendingThisMonth === 0 ? 'positive' : 'default'}
          />
          <SummaryCard
            title="Pagado este mes"
            value={formatCurrency(totalPaidThisMonth)}
            description={`${paidThisMonth.length} cuota${paidThisMonth.length !== 1 ? 's' : ''} pagada${paidThisMonth.length !== 1 ? 's' : ''}`}
            icon={CheckCircle2Icon}
            variant="positive"
          />
          <SummaryCard
            title="Falta pagar este mes"
            value={formatCurrency(totalPendingThisMonth)}
            description={`${pendingThisMonth.length} pendiente${pendingThisMonth.length !== 1 ? 's' : ''}`}
            icon={ClockIcon}
            variant="warning"
          />
          <SummaryCard
            title="Pendiente total"
            value={formatCurrency(totalPending)}
            description={`${formatCurrency(totalFinanced)} financiado en total`}
            icon={CreditCardIcon}
            variant="negative"
          />
        </div>
      )}

      {/* This month's payments */}
      {!purchasesQuery.isLoading && monthPayments.length > 0 && (
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
                      <p className="text-xs text-muted-foreground">
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
      {!purchasesQuery.isLoading && purchases.length > 0 && monthPayments.length === 0 && (
        <div className="rounded-lg border border-muted px-4 py-3 text-sm text-muted-foreground">
          Sin cuotas programadas para <span className="capitalize">{monthLabel}</span>.
        </div>
      )}

      {/* Active purchases grid */}
      {purchasesQuery.isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-1 h-4 w-24" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : activePurchases.length > 0 ? (
        <>
          <h2 className="text-sm font-medium text-muted-foreground">Compras activas ({activePurchases.length})</h2>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activePurchases.map((purchase) => {
              const pctPaid =
                purchase.totalInstallments > 0
                  ? Math.round((purchase.paidCount / purchase.totalInstallments) * 100)
                  : 0;

              return (
                <Card key={purchase.id}>
                  <CardHeader className="flex flex-row items-start justify-between pb-3">
                    <div className="flex items-start gap-2 min-w-0">
                      {purchase.category && (
                        <CategoryIconBadge
                          icon={purchase.category.icon}
                          color={purchase.category.color}
                          className="mt-0.5 size-7 shrink-0 rounded-md"
                        />
                      )}
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{purchase.description}</CardTitle>
                        <CardDescription>
                          {purchase.paidCount}/{purchase.totalInstallments} cuotas ·{' '}
                          {formatCurrency(purchase.installmentAmount)}/mes
                          {purchase.interestAmount > 0 && (
                            <>
                              {' '}
                              ·{' '}
                              <span className="text-amber-600 dark:text-amber-400">
                                {formatCurrency(purchase.interestAmount)} en intereses
                              </span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground">
                          <MoreHorizontalIcon />
                          <span className="sr-only">Acciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditPurchase(purchase)}>
                          <PencilIcon />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setDeleteId(purchase.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2Icon />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <Progress value={pctPaid} className="[&>div]:bg-primary" />
                    <div className="flex items-center justify-between text-xs tabular-nums">
                      <span className="text-muted-foreground">Pagado: <span className="text-foreground">{formatCurrency(purchase.totalPaid)}</span></span>
                      <span className="font-medium">Total: {formatCurrency(purchase.totalPaid + purchase.totalPending)}</span>
                      <span className="text-muted-foreground">Pendiente: <span className="text-foreground">{formatCurrency(purchase.totalPending)}</span></span>
                    </div>
                    {purchase.payments.find((p) => !p.transactionId && !p.paidExternally) && (
                      <p className="text-xs text-muted-foreground">
                        Próxima cuota:{' '}
                        <span className="font-medium text-foreground">
                          {formatDate(purchase.payments.find((p) => !p.transactionId && !p.paidExternally)!.dueOn)}
                        </span>
                      </p>
                    )}
                    {purchase.account && (
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: purchase.account.color }} />
                        <span className="text-xs text-muted-foreground">{purchase.account.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </section>
        </>
      ) : null}

      {/* Completed purchases */}
      {!purchasesQuery.isLoading && completedPurchases.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground">Compras saldadas ({completedPurchases.length})</h2>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {completedPurchases.map((purchase) => (
              <Card key={purchase.id} className="opacity-60">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex items-start gap-2 min-w-0">
                    {purchase.category && (
                      <CategoryIconBadge
                        icon={purchase.category.icon}
                        color={purchase.category.color}
                        className="mt-0.5 size-7 shrink-0 rounded-md"
                      />
                    )}
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">{purchase.description}</CardTitle>
                      <CardDescription>
                        {purchase.totalInstallments} cuotas · {formatCurrency(purchase.installmentAmount)}/mes
                        {purchase.interestAmount > 0 && (
                          <>
                            {' '}
                            ·{' '}
                            <span className="text-amber-600 dark:text-amber-400">
                              {formatCurrency(purchase.interestAmount)} en intereses
                            </span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground">
                        <MoreHorizontalIcon />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => setDeleteId(purchase.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2Icon />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2Icon className="size-3.5" />
                      Saldado
                    </div>
                    <span className="tabular-nums text-muted-foreground">Total: {formatCurrency(purchase.totalPaid)}</span>
                  </div>
                  {purchase.account && (
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: purchase.account.color }} />
                      <span className="text-xs text-muted-foreground">{purchase.account.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>
        </>
      )}

      {/* Empty state */}
      {!purchasesQuery.isLoading && purchases.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CreditCardIcon />
                </EmptyMedia>
                <EmptyTitle>Sin compras en cuotas</EmptyTitle>
                <EmptyDescription>
                  Registra una compra financiada y el sistema calculará cada cuota automáticamente.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <InstallmentDialog />
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      )}

      {editPurchase && (
        <EditInstallmentDialog
          purchase={editPurchase}
          open={!!editPurchase}
          onOpenChange={(o) => !o && setEditPurchase(null)}
        />
      )}

      {payingItem && (
        <PaySingleInstallmentDialog
          payment={payingItem.payment}
          purchase={payingItem.purchase}
          open={!!payingItem}
          onOpenChange={(o) => !o && setPayingItem(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        description="Se eliminará esta compra y todas sus cuotas permanentemente."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </main>
  );
}
