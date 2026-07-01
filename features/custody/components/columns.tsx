import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { CustodyMovementRow } from '../types/custody-types';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { METHOD_LABELS } from './record-movement-dialog';

type UseCustodyMovementsColumnsProps = {
  onEditMovement: (movement: CustodyMovementRow) => void;
  onDeleteMovement: (movementId: string) => void;
};

export function useCustodyMovementsColumns({ onEditMovement, onDeleteMovement }: UseCustodyMovementsColumnsProps) {
  return useMemo<ColumnDef<CustodyMovementRow>[]>(() => [
    {
      accessorKey: 'occurredOn',
      header: 'Fecha',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.getValue('occurredOn'))}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <Badge
            variant="secondary"
            className={
              type === 'deposit'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-destructive/10 text-destructive'
            }
          >
            {type === 'deposit' ? 'Depósito' : 'Desembolso'}
          </Badge>
        );
      },
    },
    {
      id: 'encargo',
      accessorFn: (row) => `${row.personName} · ${row.orderTitle}`,
      header: 'Encargo',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.personName}</span>
          <span className="text-xs text-muted-foreground">{row.original.orderTitle}</span>
        </div>
      ),
    },
    {
      accessorKey: 'method',
      header: 'Método',
      cell: ({ row }) => {
        const method = row.getValue('method') as string | null;
        return <span className="text-muted-foreground">{method ? (METHOD_LABELS[method] ?? method) : '—'}</span>;
      },
    },
    {
      accessorKey: 'amount',
      enableSorting: false,
      header: () => <div className="text-right">Monto</div>,
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div
            className={`text-right font-medium tabular-nums ${
              m.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
            }`}
          >
            {m.type === 'deposit' ? '+' : '-'}
            {formatCurrency(m.amount)}
          </div>
        );
      },
    },
    {
      accessorKey: 'notes',
      header: 'Notas',
      cell: ({ row }) => (
        <span className="max-w-50 truncate text-muted-foreground">{row.getValue('notes') || '—'}</span>
      ),
    },
    {
      id: 'actions',
      size: 48,
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground data-[state=open]:bg-muted">
                  <MoreHorizontalIcon />
                  <span className="sr-only">Acciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEditMovement(m)}>
                  <PencilIcon />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => onDeleteMovement(m.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2Icon />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [onEditMovement, onDeleteMovement]);
}
