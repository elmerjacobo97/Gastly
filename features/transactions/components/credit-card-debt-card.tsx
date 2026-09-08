'use client';

import { CreditCardIcon } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryIconBadge } from '@/components/category-icon-badge';
import { usePayAllCreditCardTransactions } from '@/lib/finance/transactions/hooks/mutations';
import { type Transaction } from '@/lib/finance/transactions/types/transaction-types';
import { formatCurrency, formatDate } from '@/lib/format';

type CreditCardDebtCardProps = {
  isLoading: boolean;
  transactions: Transaction[];
};

type CardGroup = {
  cardName: string | null;
  transactions: Transaction[];
  total: number;
  earliestDueOn: string | null;
};

function groupByCard(transactions: Transaction[]): CardGroup[] {
  const map = new Map<string, CardGroup>();
  for (const t of transactions) {
    const key = t.creditCardName ?? '__none__';
    const existing = map.get(key);
    if (existing) {
      existing.transactions.push(t);
      existing.total += t.amount;
      if (t.creditCardDueOn && (!existing.earliestDueOn || t.creditCardDueOn < existing.earliestDueOn)) {
        existing.earliestDueOn = t.creditCardDueOn;
      }
    } else {
      map.set(key, {
        cardName: t.creditCardName,
        transactions: [t],
        total: t.amount,
        earliestDueOn: t.creditCardDueOn,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.earliestDueOn && b.earliestDueOn) return a.earliestDueOn.localeCompare(b.earliestDueOn);
    return a.earliestDueOn ? -1 : 1;
  });
}

export function CreditCardDebtCard({ isLoading, transactions }: CreditCardDebtCardProps) {
  const payMutation = usePayAllCreditCardTransactions();

  if (isLoading || transactions.length === 0) return null;

  const groups = groupByCard(transactions);
  const today = new Date().toISOString().slice(0, 10);
  const grandTotal = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
            <CreditCardIcon className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base">Deuda de tarjeta de crédito</CardTitle>
            <p className="text-xs text-muted-foreground">
              {transactions.length} compra{transactions.length !== 1 ? 's' : ''} pendientes
            </p>
          </div>
        </div>
        <p className="shrink-0 text-xl font-bold tabular-nums text-destructive">{formatCurrency(grandTotal)}</p>
      </CardHeader>

      <CardContent className="pt-0">
        <Accordion type="multiple">
          {groups.map((group) => {
            const key = group.cardName ?? '__none__';
            const displayName = group.cardName ?? 'Tarjeta de crédito';
            const isOverdue = group.earliestDueOn ? group.earliestDueOn < today : false;

            return (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3 pr-3">
                    <div
                      className={`grid size-8 shrink-0 place-items-center rounded-lg ${isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}
                    >
                      <CreditCardIcon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{displayName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {group.transactions.length} compra{group.transactions.length !== 1 ? 's' : ''}
                        {group.earliestDueOn && <> · vence {formatDate(group.earliestDueOn)}</>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={isOverdue ? 'destructive' : 'outline'}
                        className={isOverdue ? undefined : 'border-amber-400/50 text-amber-600 dark:text-amber-400'}
                      >
                        {isOverdue ? 'Vencido' : 'Por pagar'}
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums">{formatCurrency(group.total)}</span>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pb-0">
                  <div className="rounded-xl border bg-muted/30 overflow-hidden mb-4">
                    <div className="divide-y">
                      {group.transactions.map((t) => (
                        <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                          {t.category ? (
                            <CategoryIconBadge
                              icon={t.category.icon}
                              color={t.category.color}
                              className="size-7 shrink-0 rounded-md"
                            />
                          ) : (
                            <div className="size-7 shrink-0 rounded-md bg-muted" />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{t.description}</span>
                            <span className="block text-xs text-muted-foreground">{formatDate(t.occurredOn)}</span>
                          </div>
                          <span className="shrink-0 text-sm font-medium tabular-nums text-destructive">
                            -{formatCurrency(t.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
                      <p className="text-sm text-muted-foreground">
                        Total:{' '}
                        <span className="font-semibold text-foreground tabular-nums">
                          {formatCurrency(group.total)}
                        </span>
                      </p>
                      <Button
                        size="sm"
                        disabled={payMutation.isPending}
                        onClick={() => payMutation.mutate(group.cardName)}
                      >
                        Marcar como pagado
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
