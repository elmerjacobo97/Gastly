'use client';

import { PackageIcon } from 'lucide-react';

import { OrderCard } from '@/features/custody/components/order-card';
import { type CustodyOrder } from '@/lib/finance/custody/types/custody-types';

type OrdersSectionProps = {
  orders: CustodyOrder[];
  selectedOrderId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (order: CustodyOrder) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
};

export function OrdersSection({
  orders,
  selectedOrderId,
  onSelect,
  onEdit,
  onDelete,
  onComplete,
}: OrdersSectionProps) {
  const activeOrders = orders.filter((o) => o.status === 'active');
  const completedOrders = orders.filter((o) => o.status !== 'active');

  return (
    <>
      {activeOrders.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Activos ({activeOrders.length})</h2>
            {selectedOrderId && (
              <p className="text-xs text-muted-foreground">Movimientos filtrados por encargo</p>
            )}
          </div>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                selected={selectedOrderId === order.id}
                onSelect={() => onSelect(selectedOrderId === order.id ? null : order.id)}
                onEdit={() => onEdit(order)}
                onDelete={() => onDelete(order.id)}
                onComplete={() => onComplete(order.id)}
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
                onSelect={() => onSelect(selectedOrderId === order.id ? null : order.id)}
                onEdit={() => onEdit(order)}
                onDelete={() => onDelete(order.id)}
                onComplete={() => onComplete(order.id)}
              />
            ))}
          </section>
        </>
      )}
    </>
  );
}

export function EmptyOrders() {
  return (
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
    </div>
  );
}
