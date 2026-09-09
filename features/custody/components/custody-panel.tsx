'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CustodyOrderDialog } from '@/features/custody/components/custody-order-dialog';
import { EditCustodyOrderDialog } from '@/features/custody/components/edit-custody-order-dialog';
import { EmptyOrders, OrdersSection } from '@/features/custody/components/orders-section';
import { MovementsHistory } from '@/features/custody/components/movements-history';
import { SummaryCards } from '@/features/custody/components/summary-cards';
import { RecordMovementDialog } from '@/features/custody/components/record-movement-dialog';
import {
  deleteCustodyMovement,
  deleteCustodyOrder,
  updateCustodyOrderStatus,
} from '@/features/custody/server/actions';
import { type CustodyMovementRow, type CustodyOrder } from '@/features/custody/types/custody-types';

type CustodyPanelProps = {
  orders: CustodyOrder[];
};

export function CustodyPanel({ orders }: CustodyPanelProps) {
  const [isPending, startTransition] = useTransition();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editOrder, setEditOrder] = useState<CustodyOrder | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [editMovement, setEditMovement] = useState<CustodyMovementRow | null>(null);
  const [deleteMovementId, setDeleteMovementId] = useState<string | null>(null);
  const [completeOrderId, setCompleteOrderId] = useState<string | null>(null);

  const editMovementOrder = editMovement
    ? orders.find((o) => o.id === editMovement.custodyOrderId)
    : null;

  function runAction(action: () => Promise<void>, successMessage: string, onDone?: () => void) {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        onDone?.();
      } catch (error) {
        toast.error('Ocurrió un error', {
          description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
        });
      }
    });
  }

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

      {orders.length > 0 && <SummaryCards orders={orders} />}

      {orders.length === 0 ? (
        <>
          <EmptyOrders />
          <div className="flex justify-center">
            <CustodyOrderDialog triggerLabel="Registrar primer encargo" />
          </div>
        </>
      ) : (
        <OrdersSection
          orders={orders}
          selectedOrderId={selectedOrderId}
          onSelect={setSelectedOrderId}
          onEdit={setEditOrder}
          onDelete={setDeleteOrderId}
          onComplete={setCompleteOrderId}
        />
      )}

      <MovementsHistory
        orders={orders}
        selectedOrderId={selectedOrderId}
        onEditMovement={setEditMovement}
        onDeleteMovement={setDeleteMovementId}
      />

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
        pending={isPending}
        onConfirm={() => {
          if (!deleteOrderId) return;
          const id = deleteOrderId;
          runAction(
            () => deleteCustodyOrder(id),
            'Encargo eliminado',
            () => {
              if (selectedOrderId === id) setSelectedOrderId(null);
              setDeleteOrderId(null);
            }
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteMovementId)}
        onOpenChange={(open) => !open && setDeleteMovementId(null)}
        title="Eliminar movimiento"
        description="Se eliminará este registro del historial. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        pending={isPending}
        onConfirm={() => {
          if (!deleteMovementId) return;
          const id = deleteMovementId;
          runAction(() => deleteCustodyMovement(id), 'Movimiento eliminado', () =>
            setDeleteMovementId(null)
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(completeOrderId)}
        onOpenChange={(open) => !open && setCompleteOrderId(null)}
        title="Marcar encargo como completado"
        description="El encargo quedará cerrado pero su historial seguirá disponible."
        confirmLabel="Completar"
        pending={isPending}
        onConfirm={() => {
          if (!completeOrderId) return;
          const id = completeOrderId;
          runAction(
            () => updateCustodyOrderStatus(id, 'completed'),
            'Estado del encargo actualizado',
            () => setCompleteOrderId(null)
          );
        }}
      />
    </main>
  );
}
