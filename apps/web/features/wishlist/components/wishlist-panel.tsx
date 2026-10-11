"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { CreateTransactionDialog } from "@/components/create-transaction-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { type Category } from "@/lib/category-types";
import { SummaryCards } from "@/features/wishlist/components/summary-cards";
import { WishlistItemDialog } from "@/features/wishlist/components/wishlist-item-dialog";
import { WishlistSection } from "@/features/wishlist/components/wishlist-section";
import {
  deleteWishlistItem,
  setWishlistItemStatus,
} from "@/features/wishlist/server/actions";
import {
  type WishlistItem,
  type WishlistStatus,
} from "@/features/wishlist/types/wishlist-types";

type WishlistPanelProps = {
  items: WishlistItem[];
  categories: Category[];
};

export function WishlistPanel({ items, categories }: WishlistPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [editItem, setEditItem] = useState<WishlistItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [purchaseItem, setPurchaseItem] = useState<WishlistItem | null>(null);

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteWishlistItem(id);
        toast.success("Producto eliminado");
        setDeleteId(null);
      } catch (error) {
        toast.error("No se pudo eliminar el producto", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  function changeStatus(id: string, status: WishlistStatus) {
    startTransition(async () => {
      try {
        await setWishlistItemStatus(id, status);
        toast.success(
          status === "purchased"
            ? "Marcado como comprado"
            : "Producto vuelto a pendiente",
        );
      } catch (error) {
        toast.error("No se pudo cambiar el estado", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Lista de deseos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Guarda lo que quieres comprar a futuro y regístralo como gasto al
            comprarlo.
          </p>
        </div>
        <WishlistItemDialog />
      </section>

      {items.length > 0 && <SummaryCards items={items} />}

      <WishlistSection
        items={items}
        onEdit={setEditItem}
        onDelete={setDeleteId}
        onPurchase={setPurchaseItem}
        onRevertToPending={(item) => changeStatus(item.id, "pending")}
      />

      {editItem && (
        <WishlistItemDialog
          item={editItem}
          open
          onOpenChange={(open) => !open && setEditItem(null)}
        />
      )}

      {purchaseItem && (
        <CreateTransactionDialog
          categories={categories}
          open
          onOpenChange={(open) => !open && setPurchaseItem(null)}
          initialValues={{
            amount: purchaseItem.estimatedPrice,
            currency: purchaseItem.currency,
            description: purchaseItem.name,
            notes: purchaseItem.notes ?? "",
          }}
          onSuccess={() => changeStatus(purchaseItem.id, "purchased")}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        description="Se eliminará este producto de tu lista."
        pending={isPending}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </main>
  );
}
