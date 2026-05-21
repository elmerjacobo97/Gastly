'use client';

import { useQuery } from '@tanstack/react-query';
import { CircleDollarSignIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TransactionDialog } from '@/features/transactions/components/transaction-dialog';
import { getTransactions } from '@/features/transactions/lib/transactions-api';
import { formatCurrency, formatDate } from '@/features/transactions/lib/format-transaction';

export function IncomePanel() {
  const incomeQuery = useQuery({
    queryKey: ['transactions', 'income'],
    queryFn: () => getTransactions('income'),
  });
  const income = incomeQuery.data ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Ingresos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registra y revisa todos tus ingresos personales.</p>
        </div>
        <TransactionDialog defaultType="income" lockType triggerLabel="Nuevo ingreso" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos recientes</CardTitle>
          <CardDescription>Ultimos ingresos registrados en tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          {incomeQuery.isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : income.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {income.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>{item.category?.name ?? 'Sin categoria'}</TableCell>
                    <TableCell>{formatDate(item.occurredOn)}</TableCell>
                    <TableCell className="text-right">+{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CircleDollarSignIcon />
                </EmptyMedia>
                <EmptyTitle>Aun no tienes ingresos</EmptyTitle>
                <EmptyDescription>Crea tu primer ingreso para empezar a controlar tus entradas.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <TransactionDialog defaultType="income" lockType triggerLabel="Agregar ingreso" />
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
