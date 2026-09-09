'use client';

import { CreditCardIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InstallmentDialog } from '@/features/installments/components/installment-dialog';
import { type Account } from '@/features/accounts/types/account-types';
import { type Category } from '@/features/categories/types/category-types';

type InstallmentsEmptyStateProps = {
  accounts: Account[];
  categories: Category[];
};

export function InstallmentsEmptyState({ accounts, categories }: InstallmentsEmptyStateProps) {
  return (
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
  );
}
