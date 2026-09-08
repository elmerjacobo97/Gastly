import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { CheckCircle2Icon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { DepositButton, DisbursementButton } from '@/features/custody/components/record-movement-dialog';
import { type CustodyOrder } from '@/lib/finance/custody/types/custody-types';

type OrderCardProps = {
  order: CustodyOrder;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
};

export function OrderCard({ order, selected, onSelect, onEdit, onDelete, onComplete }: OrderCardProps) {
  const pctProgress =
    order.targetAmount && order.targetAmount > 0
      ? Math.min(100, Math.round((order.totalDeposited / order.targetAmount) * 100))
      : null;

  const isActive = order.status === 'active';

  return (
    <Card className={cn('cursor-pointer transition-colors', selected && 'ring-2 ring-primary')} onClick={onSelect}>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="truncate text-base">{order.personName}</CardTitle>
            {order.status === 'completed' && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                Completado
              </Badge>
            )}
            {order.status === 'cancelled' && (
              <Badge variant="outline" className="shrink-0 text-xs">
                Cancelado
              </Badge>
            )}
          </div>
          <CardDescription className="truncate">{order.title}</CardDescription>
          {order.targetAmount != null && order.targetAmount > 0 && (
            <p className="mt-1 text-sm font-semibold tabular-nums">Objetivo: {formatCurrency(order.targetAmount)}</p>
          )}
          {order.expectedOn && (
            <Badge variant="secondary" className="mt-1.5 text-xs font-normal">
              Estimado:{' '}
              {format(new Date(`${order.expectedOn}T12:00:00`), 'd MMM yyyy', {
                locale: es,
              })}
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontalIcon />
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={onEdit}>
              <PencilIcon />
              Editar
            </DropdownMenuItem>
            {isActive && (
              <DropdownMenuItem onSelect={onComplete}>
                <CheckCircle2Icon />
                Marcar completado
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
              <Trash2Icon />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        {pctProgress != null && <Progress value={pctProgress} className="[&>div]:bg-primary" />}
        <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
          <span>Depositado: {formatCurrency(order.totalDeposited)}</span>
          <span>Desembolsado: {formatCurrency(order.totalDisbursed)}</span>
        </div>
        <p className="text-sm font-semibold tabular-nums">En custodia: {formatCurrency(order.balanceHeld)}</p>
        {order.notes && <p className="truncate text-xs text-muted-foreground">{order.notes}</p>}
        {isActive && (
          <div className="flex flex-wrap gap-2">
            <DepositButton order={order} />
            <DisbursementButton order={order} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
