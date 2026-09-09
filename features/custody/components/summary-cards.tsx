import { CheckCircle2Icon, PackageIcon, ShieldIcon } from 'lucide-react';

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { computeCustodySummary } from '@/features/custody/lib/custody-api';
import { type CustodyOrder } from '@/features/custody/types/custody-types';
import { formatCurrency } from '@/lib/format';

export function SummaryCards({ orders }: { orders: CustodyOrder[] }) {
  const summary = computeCustodySummary(orders);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">En custodia</CardTitle>
          <CardAction>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <ShieldIcon className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {summary.activeCount} encargo{summary.activeCount !== 1 ? 's' : ''} activo
            {summary.activeCount !== 1 ? 's' : ''}
          </p>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(summary.totalHeld)}</p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Activos</CardTitle>
          <CardAction>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <PackageIcon className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold tabular-nums">{summary.activeCount}</p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">Completados</CardTitle>
          <CardAction>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <CheckCircle2Icon className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold tabular-nums">{summary.completedCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
