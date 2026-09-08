import { PackageIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { computeCustodySummary } from '@/lib/finance/custody/lib/custody-api';
import { getCustodyOrders } from '@/lib/finance/custody/server/queries';
import { formatCurrency } from '@/lib/format';

export async function CustodySummaryCard() {
  const orders = await getCustodyOrders();
  const summary = computeCustodySummary(orders);

  if (summary.totalHeld <= 0 && summary.activeCount === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <PackageIcon className="size-4 text-muted-foreground" />
          Encargos en custodia
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/custody">Ver detalle</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{formatCurrency(summary.totalHeld)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {summary.activeCount} encargo{summary.activeCount !== 1 ? 's' : ''} activo
          {summary.activeCount !== 1 ? 's' : ''} · dinero de terceros, no incluido en tu balance
        </p>
      </CardContent>
    </Card>
  );
}
