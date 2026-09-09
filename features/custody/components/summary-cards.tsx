import { CheckCircle2Icon, PackageIcon, ShieldIcon } from 'lucide-react';

import { computeCustodySummary } from '@/features/custody/lib/custody-api';
import { type CustodyOrder } from '@/features/custody/types/custody-types';
import { formatCurrency } from '@/lib/format';

export function SummaryCards({ orders }: { orders: CustodyOrder[] }) {
  const summary = computeCustodySummary(orders);

  return (
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
  );
}
