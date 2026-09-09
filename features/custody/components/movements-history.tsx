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
  selectedOrderId: string | null;
  onEditMovement: (movement: CustodyMovementRow) => void;
  onDeleteMovement: (movementId: string) => void;
};

export function MovementsHistory({
  orders,
  selectedOrderId,
  onEditMovement,
  onDeleteMovement,
}: MovementsHistoryProps) {
  const allMovements = useMemo(() => flattenCustodyMovements(orders), [orders]);
  const filteredMovements = useMemo(() => {
    const rows = selectedOrderId
      ? allMovements.filter((m) => m.custodyOrderId === selectedOrderId)
      : allMovements;
    return rows.toSorted(
      (a, b) =>
        new Date(`${b.occurredOn}T12:00:00`).getTime() - new Date(`${a.occurredOn}T12:00:00`).getTime()
    );
  }, [allMovements, selectedOrderId]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;

  const totals = filteredMovements.reduce(
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
          {selectedOrder ? `${selectedOrder.personName} · ${selectedOrder.title}` : 'Todos los encargos'}
          {' · '}
          {filteredMovements.length} movimiento
          {filteredMovements.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredMovements.length > 0 && (
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <p className="text-muted-foreground">Depositado</p>
              <p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totals.deposited)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <p className="text-muted-foreground">Desembolsado</p>
              <p className="font-semibold tabular-nums text-destructive">{formatCurrency(totals.disbursed)}</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <p className="text-muted-foreground">En custodia</p>
              <p className="font-semibold tabular-nums">{formatCurrency(balance)}</p>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          data={filteredMovements}
          searchPlaceholder="Buscar por persona, propósito o notas..."
          emptyState={
            <Empty className="bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PackageIcon />
                </EmptyMedia>
                <EmptyTitle>Sin movimientos</EmptyTitle>
                <EmptyDescription>
                  {selectedOrder
                    ? 'Registra un depósito o desembolso para este encargo.'
                    : 'Los depósitos y desembolsos aparecerán aquí.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          }
        />
      </CardContent>
    </Card>
  );
}
