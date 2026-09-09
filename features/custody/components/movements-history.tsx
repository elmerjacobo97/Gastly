'use client';

import { useMemo } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { useCustodyMovementsColumns } from '@/features/custody/components/columns';
import { flattenCustodyMovements } from '@/features/custody/lib/custody-api';
import { type CustodyMovementRow, type CustodyOrder } from '@/features/custody/types/custody-types';
import { formatCurrency } from '@/lib/format';
import { PackageIcon } from 'lucide-react';

type MovementsHistoryProps = {
  orders: CustodyOrder[];
  onEditMovement: (movement: CustodyMovementRow) => void;
  onDeleteMovement: (movementId: string) => void;
};

export function MovementsHistory({ orders, onEditMovement, onDeleteMovement }: MovementsHistoryProps) {
  const movements = useMemo(() => {
    const all = flattenCustodyMovements(orders);
    return all.toSorted(
      (a, b) => new Date(`${b.occurredOn}T12:00:00`).getTime() - new Date(`${a.occurredOn}T12:00:00`).getTime()
    );
  }, [orders]);

  const totals = movements.reduce(
    (acc, m) => {
      if (m.type === 'deposit') acc.deposited += m.amount;
      else acc.disbursed += m.amount;
      return acc;
    },
    { deposited: 0, disbursed: 0 }
  );
  const balance = totals.deposited - totals.disbursed;

  const columns = useCustodyMovementsColumns({
    onEditMovement,
    onDeleteMovement,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Historial de movimientos</CardTitle>
        <CardDescription>
          Todos los encargos · {movements.length} movimiento{movements.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {movements.length > 0 && (
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Depositado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totals.deposited)}
                </p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Desembolsado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold tabular-nums text-destructive">
                  {formatCurrency(totals.disbursed)}
                </p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">En custodia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold tabular-nums">{formatCurrency(balance)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <DataTable
          columns={columns}
          data={movements}
          searchPlaceholder="Buscar por persona, propósito o notas..."
          emptyState={
            <Empty className="bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PackageIcon />
                </EmptyMedia>
                <EmptyTitle>Sin movimientos</EmptyTitle>
                <EmptyDescription>
                  Los depósitos y desembolsos aparecerán aquí.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          }
        />
      </CardContent>
    </Card>
  );
}
