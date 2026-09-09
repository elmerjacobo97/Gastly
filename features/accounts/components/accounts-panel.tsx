"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { AccountsGrid } from "@/features/accounts/components/accounts-grid"
import { CreateAccountDialog } from "@/features/accounts/components/create-account-dialog"
import { EditAccountDialog } from "@/features/accounts/components/edit-account-dialog"
import { SummaryCard } from "@/features/accounts/components/summary-card"
import { TransferDialog } from "@/features/accounts/components/transfer-dialog"
import { TransfersList } from "@/features/accounts/components/transfers-list"
import { exportTransfersCSV, transfersCsvFilename } from "@/features/accounts/lib/transfers-export"
import { deleteAccount } from "@/features/accounts/server/actions"
import { type Account, type AccountTransfer } from "@/features/accounts/types/account-types"
import { WalletIcon } from "lucide-react"

type AccountsPanelProps = {
  accounts: Account[]
  transfers: AccountTransfer[]
}

export function AccountsPanel({ accounts, transfers }: AccountsPanelProps) {
  const [isPending, startTransition] = useTransition()

  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [transferFromId, setTransferFromId] = useState<string | undefined>(undefined)
  const [transferOpen, setTransferOpen] = useState(false)
  const [csvConfirmOpen, setCsvConfirmOpen] = useState(false)

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteAccount(id)
        toast.success("Cuenta eliminada")
        setDeleteId(null)
      } catch (error) {
        toast.error("No se pudo eliminar la cuenta", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Cuentas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra tus cuentas bancarias y de ahorro para saber dónde está tu dinero.
          </p>
        </div>
        <CreateAccountDialog />
      </section>

      {accounts.length > 0 && <SummaryCard accounts={accounts} />}

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <WalletIcon />
                </EmptyMedia>
                <EmptyTitle>Sin cuentas registradas</EmptyTitle>
                <EmptyDescription>
                  Agrega tus cuentas bancarias o de ahorro para ver tu patrimonio total.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CreateAccountDialog />
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <AccountsGrid
          accounts={accounts}
          onEdit={setEditAccount}
          onTransfer={(accountId) => {
            setTransferFromId(accountId)
            setTransferOpen(true)
          }}
          onDelete={setDeleteId}
        />
      )}

      <TransfersList transfers={transfers} onExport={() => setCsvConfirmOpen(true)} />

      {editAccount && (
        <EditAccountDialog
          account={editAccount}
          open={Boolean(editAccount)}
          onOpenChange={(o) => !o && setEditAccount(null)}
        />
      )}

      <TransferDialog
        accounts={accounts}
        open={transferOpen}
        onOpenChange={(o) => {
          setTransferOpen(o)
          if (!o) setTransferFromId(undefined)
        }}
        defaultFromAccountId={transferFromId}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Eliminar cuenta"
        description="Se eliminará la cuenta y su historial de transferencias. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        pending={isPending}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />

      <AlertDialog open={csvConfirmOpen} onOpenChange={setCsvConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exportar transferencias</AlertDialogTitle>
            <AlertDialogDescription>
              Se descargará un archivo CSV con {transfers.length} transferencia
              {transfers.length !== 1 ? "s" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                exportTransfersCSV(transfers, transfersCsvFilename())
                setCsvConfirmOpen(false)
              }}
            >
              Descargar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
