"use client";

import { PlusIcon, WalletIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { QuickCreateAccountDialog } from "@/components/quick-create-account-dialog";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { EditAccountDialog } from "@/features/accounts/components/edit-account-dialog";
import { deleteAccount } from "@/features/accounts/server/actions";
import { type Account } from "@/lib/account-types";
import { formatCurrency } from "@/lib/format";

type AccountsPanelProps = {
  accounts: Account[];
};

export function AccountsPanel({ accounts }: AccountsPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteAccount(id);
        toast.success("Cuenta eliminada");
        setDeleteId(null);
      } catch (error) {
        toast.error("No se pudo eliminar la cuenta", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Cuentas</h2>
          <p className="text-sm text-muted-foreground">
            Administra las cuentas donde se registran tus pagos y cuotas.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Nueva cuenta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todas las cuentas</CardTitle>
          <CardDescription>
            {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <Empty className="bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <WalletIcon />
                </EmptyMedia>
                <EmptyTitle>Sin cuentas aún</EmptyTitle>
                <EmptyDescription>
                  Crea una cuenta para llevar el saldo de tus pagos.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: account.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {account.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                  </div>
                  <RowActionsMenu
                    onEdit={() => setEditAccount(account)}
                    onDelete={() => setDeleteId(account.id)}
                    className="shrink-0 text-muted-foreground"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <QuickCreateAccountDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => undefined}
      />
      {editAccount && (
        <EditAccountDialog
          account={editAccount}
          open={Boolean(editAccount)}
          onOpenChange={(o) => !o && setEditAccount(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        description="Se eliminará esta cuenta. Los pagos recurrentes y cuotas vinculados quedarán sin cuenta y sus transferencias se borrarán."
        pending={isPending}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  );
}
