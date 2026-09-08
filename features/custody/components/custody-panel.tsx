'use client';

import { AlertTriangleIcon, CheckCircle2Icon, PackageIcon, RefreshCwIcon, ShieldIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustodyMovementsColumns } from '@/features/custody/components/columns';
import { CustodyOrderDialog } from '@/features/custody/components/custody-order-dialog';
import { EditCustodyOrderDialog } from '@/features/custody/components/edit-custody-order-dialog';
import { RecordMovementDialog } from '@/features/custody/components/record-movement-dialog';
import {
  useDeleteCustodyMovement,
  useDeleteCustodyOrder,
  useUpdateCustodyOrderStatus,
} from '@/lib/finance/custody/hooks/mutations';
import { useCustodyOrders } from '@/lib/finance/custody/hooks/queries';
import { computeCustodySummary, flattenCustodyMovements } from '@/lib/finance/custody/lib/custody-api';
import { type CustodyMovementRow, type CustodyOrder } from '@/lib/finance/custody/types/custody-types';
import { formatCurrency } from '@/lib/format';
import { OrderCard } from '@/features/custody/components/order-card';

export function CustodyPanel() {
  const deleteOrderMutation = useDeleteCustodyOrder();
  const deleteMovementMutation = useDeleteCustodyMovement();
  const completeMutation = useUpdateCustodyOrderStatus();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editOrder, setEditOrder] = useState<CustodyOrder | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [editMovement, setEditMovement] = useState<CustodyMovementRow | null>(null);
  const [deleteMovementId, setDeleteMovementId] = useState<string | null>(null);
  const [completeOrderId, setCompleteOrderId] = useState<string | null>(null);

  const { data: orders = [], isLoading, isError, error, refetch } = useCustodyOrders();
  const summary = computeCustodySummary(orders ?? []);
  const activeOrders = orders.filter((o) => o.status === 'active');
  const completedOrders = orders.filter((o) => o.status !== 'active');
  const allMovements = useMemo(() => flattenCustodyMovements(orders), [orders]);
  const filteredMovements = useMemo(() => {
    const rows = selectedOrderId ? allMovements.filter((m) => m.custodyOrderId === selectedOrderId) : allMovements;
    return rows.toSorted(
      (a, b) => new Date(`${b.occurredOn}T12:00:00`).getTime() - new Date(`${a.occurredOn}T12:00:00`).getTime()
    );
  }, [allMovements, selectedOrderId]);

  const totals = filteredMovements.reduce(
    (acc, m) => {
      if (m.type === 'deposit') acc.deposited += m.amount;
      else acc.disbursed += m.amount;
      return acc;
    },
    { deposited: 0, disbursed: 0 }
  );
  const balance = totals.deposited - totals.disbursed;

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;
  const editMovementOrder = editMovement ? orders.find((o) => o.id === editMovement.custodyOrderId) : null;

  const columns = useCustodyMovementsColumns({
    onEditMovement: setEditMovement,
    onDeleteMovement: setDeleteMovementId,
  });

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Encargos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dinero en custodia de terceros. Lleva un historial claro de cada depósito y desembolso.
          </p>
        </div>
        <CustodyOrderDialog />
      </section>

      {isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudo cargar la información</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Intenta recargar la información.'}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <ShieldIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">En custodia</p>
              <p className="truncate text-xs text-muted-foreground">
                {summary.activeCount} encargo{summary.activeCount !== 1 ? 's' : ''} activo
                {summary.activeCount !== 1 ? 's' : ''}
              </p>
            </div>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(summary.totalHeld)}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <PackageIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Activos</p>
            </div>
            <p className="text-lg font-semibold tabular-nums">{summary.activeCount}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <CheckCircle2Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Completados</p>
            </div>
            <p className="text-lg font-semibold tabular-nums">{summary.completedCount}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : orders.length === 0 && !isError ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <PackageIcon className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No hay encargos registrados</p>
            <p className="text-sm text-muted-foreground">
              Registra dinero en custodia para llevar un historial de depósitos y desembolsos.
            </p>
          </div>
          <CustodyOrderDialog triggerLabel="Registrar primer encargo" />
        </div>
      ) : (
        <>
          {activeOrders.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">Activos ({activeOrders.length})</h2>
                {selectedOrderId && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedOrderId(null)}>
                    Ver todos los movimientos
                  </Button>
                )}
              </div>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    selected={selectedOrderId === order.id}
                    onSelect={() => setSelectedOrderId((prev) => (prev === order.id ? null : order.id))}
                    onEdit={() => setEditOrder(order)}
                    onDelete={() => setDeleteOrderId(order.id)}
                    onComplete={() => setCompleteOrderId(order.id)}
                  />
                ))}
              </section>
            </>
          )}

          {completedOrders.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-muted-foreground">
                Completados / cancelados ({completedOrders.length})
              </h2>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {completedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    selected={selectedOrderId === order.id}
                    onSelect={() => setSelectedOrderId((prev) => (prev === order.id ? null : order.id))}
                    onEdit={() => setEditOrder(order)}
                    onDelete={() => setDeleteOrderId(order.id)}
                    onComplete={() => setCompleteOrderId(order.id)}
                  />
                ))}
              </section>
            </>
          )}
        </>
      )}

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
            isLoading={isLoading}
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

      {editOrder && (
        <EditCustodyOrderDialog
          order={editOrder}
          open={Boolean(editOrder)}
          onOpenChange={(open) => !open && setEditOrder(null)}
        />
      )}

      {editMovement && editMovementOrder && (
        <RecordMovementDialog
          order={editMovementOrder}
          movement={editMovement}
          open={Boolean(editMovement)}
          onOpenChange={(open) => !open && setEditMovement(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteOrderId)}
        onOpenChange={(open) => !open && setDeleteOrderId(null)}
        title="Eliminar encargo"
        description="Se eliminará el encargo y todo su historial de movimientos. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!deleteOrderId) return;
          deleteOrderMutation.mutate(deleteOrderId, {
            onSuccess: () => {
              if (selectedOrderId === deleteOrderId) setSelectedOrderId(null);
              setDeleteOrderId(null);
            },
          });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteMovementId)}
        onOpenChange={(open) => !open && setDeleteMovementId(null)}
        title="Eliminar movimiento"
        description="Se eliminará este registro del historial. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!deleteMovementId) return;
          deleteMovementMutation.mutate(deleteMovementId, {
            onSuccess: () => setDeleteMovementId(null),
          });
        }}
      />

      <ConfirmDialog
        open={Boolean(completeOrderId)}
        onOpenChange={(open) => !open && setCompleteOrderId(null)}
        title="Marcar encargo como completado"
        description="El encargo quedará cerrado pero su historial seguirá disponible."
        confirmLabel="Completar"
        onConfirm={() => {
          if (!completeOrderId) return;
          completeMutation.mutate(
            { id: completeOrderId, status: 'completed' },
            { onSuccess: () => setCompleteOrderId(null) }
          );
        }}
      />
    </main>
  );
}
