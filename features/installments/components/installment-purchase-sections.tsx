'use client';

import { CheckCircle2Icon, MoreHorizontalIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { CategoryIconBadge } from '@/components/category-icon-badge';
import { RowActionsMenu } from '@/components/row-actions-menu';
import { type InstallmentPurchase } from '@/features/installments/types/installment-types';
import { formatCurrency, formatDate } from '@/lib/format';

type InstallmentPurchaseSectionsProps = {
  activePurchases: InstallmentPurchase[];
  completedPurchases: InstallmentPurchase[];
  onEdit: (purchase: InstallmentPurchase) => void;
  onDelete: (id: string) => void;
};

export function InstallmentPurchaseSections({
  activePurchases,
  completedPurchases,
  onEdit,
  onDelete,
}: InstallmentPurchaseSectionsProps) {
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
