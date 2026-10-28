"use client";

import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  GiftIcon,
  Undo2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { RowActionsMenu } from "@/components/row-actions-menu";
import { StatusBadge } from "@/components/status-badge";
import { TableSearchInput } from "@/components/table-search-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WishlistItemDialog } from "@/features/wishlist/components/wishlist-item-dialog";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "@/features/wishlist/lib/wishlist-labels";
import {
  type WishlistItem,
  type WishlistPriority,
} from "@/features/wishlist/types/wishlist-types";
import { formatCurrency } from "@/lib/format";
import { matchesQuery } from "@/lib/search";

type ItemFilter = "pending" | "purchased" | "all";

const FILTER_OPTIONS: { value: ItemFilter; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "purchased", label: "Comprados" },
  { value: "all", label: "Todos" },
];

const PRIORITY_TONES: Record<WishlistPriority, "danger" | "warning" | "muted"> =
  {
    high: "danger",
    medium: "warning",
    low: "muted",
  };

type WishlistSectionProps = {
  items: WishlistItem[];
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onPurchase: (item: WishlistItem) => void;
  onRevertToPending: (item: WishlistItem) => void;
};

export function WishlistSection({
  items,
  onEdit,
  onDelete,
  onPurchase,
  onRevertToPending,
}: WishlistSectionProps) {
  const [filter, setFilter] = useState<ItemFilter>("pending");
  const [query, setQuery] = useState("");

  const pendingCount = items.filter((item) => item.status === "pending").length;
  const purchasedCount = items.length - pendingCount;

  const visibleItems = useMemo(
    () =>
      items
        .filter((item) => filter === "all" || item.status === filter)
        .filter((item) => matchesQuery(query, item.name)),
    [filter, items, query],
  );

  if (items.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GiftIcon />
          </EmptyMedia>
          <EmptyTitle>Tu lista está vacía</EmptyTitle>
          <EmptyDescription>
            Agrega lo que quieres comprar a futuro para tenerlo a la mano.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <WishlistItemDialog />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Productos</CardTitle>
        <CardDescription>
          {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""} ·{" "}
          {purchasedCount} comprado{purchasedCount !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TableSearchInput value={query} onChange={setQuery} />
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={FILTER_OPTIONS}
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Precio estimado</TableHead>
                <TableHead className="sticky right-0 w-12 bg-card">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin resultados.
                  </TableCell>
                </TableRow>
              ) : (
                visibleItems.map((item) => {
                  const isPending = item.status === "pending";

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex min-w-0 flex-col">
                            <span
                              className="line-clamp-2 max-w-48 font-medium whitespace-normal break-words"
                              title={item.name}
                            >
                              {item.name}
                            </span>
                            {item.notes && (
                              <span
                                className="max-w-48 truncate text-xs text-muted-foreground"
                                title={item.notes}
                              >
                                {item.notes}
                              </span>
                            )}
                          </div>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Abrir link del producto"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLinkIcon className="size-3.5" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={PRIORITY_TONES[item.priority]}>
                          {PRIORITY_LABELS[item.priority]}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={isPending ? "muted" : "success"}>
                          {STATUS_LABELS[item.status]}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatCurrency(item.estimatedPrice, item.currency)}
                      </TableCell>
                      <TableCell className="sticky right-0 bg-card shadow-[-8px_0_8px_-8px_rgb(0_0_0/0.15)] [tr:hover>&]:bg-muted">
                        <div className="flex items-center justify-end">
                          <RowActionsMenu
                            onEdit={() => onEdit(item)}
                            onDelete={() => onDelete(item.id)}
                            additionalActions={
                              isPending
                                ? [
                                    {
                                      icon: <CheckCircle2Icon />,
                                      label: "Marcar como comprado",
                                      onSelect: () => onPurchase(item),
                                    },
                                  ]
                                : [
                                    {
                                      icon: <Undo2Icon />,
                                      label: "Volver a pendiente",
                                      onSelect: () => onRevertToPending(item),
                                    },
                                  ]
                            }
                            className="text-muted-foreground data-[state=open]:bg-muted"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
