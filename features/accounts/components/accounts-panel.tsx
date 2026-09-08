"use client"

import { format } from "date-fns"
import {
  ArrowLeftRightIcon,
  AlertTriangleIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  Trash2Icon,
  WalletIcon,
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateAccountDialog } from "@/features/accounts/components/create-account-dialog"
import { EditAccountDialog } from "@/features/accounts/components/edit-account-dialog"
import { TransferDialog } from "@/features/accounts/components/transfer-dialog"
import { useAccounts, useAccountTransfers } from "@/lib/finance/accounts/hooks/queries"
import { useDeleteAccount } from "@/lib/finance/accounts/hooks/mutations"
import { type Account, type AccountTransfer } from "@/lib/finance/accounts/types/account-types"
import { formatCurrency, formatDate } from "@/lib/format"

function exportTransfersCSV(transfers: AccountTransfer[], filename: string) {
  const headers = ["Fecha", "Origen", "Destino", "Monto", "Notas"]
  const rows = transfers.map((t) => [
    t.occurredOn,
    t.fromAccountName,
    t.toAccountName,
    t.amount.toString(),
    t.notes ?? "",
  ])
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function AccountsPanel() {
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [transferFromId, setTransferFromId] = useState<string | undefined>(undefined)
  const [transferOpen, setTransferOpen] = useState(false)
  const [csvConfirmOpen, setCsvConfirmOpen] = useState(false)

  const accountsQuery = useAccounts()
  const accounts = accountsQuery.data ?? []
  const isLoading = accountsQuery.isLoading
  const transfersQuery = useAccountTransfers(accounts.length > 0)
  const transfers = transfersQuery.data ?? []
  const deleteMutation = useDeleteAccount()

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, { onSuccess: () => setDeleteId(null) })
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

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

      {accountsQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudo cargar la información</AlertTitle>
          <AlertDescription>
            {accountsQuery.error instanceof Error
              ? accountsQuery.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => accountsQuery.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {transfersQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudieron cargar las transferencias</AlertTitle>
          <AlertDescription>
            {transfersQuery.error instanceof Error
              ? transfersQuery.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => transfersQuery.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {isLoading && (
        <div className="rounded-xl border bg-card p-3.5 flex items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-28" />
        </div>
      )}

      {!isLoading && accounts.length > 0 && (
        <div className="rounded-xl border bg-card p-3.5 flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <WalletIcon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-muted-foreground">Total en cuentas</p>
            <p className="truncate text-xs text-muted-foreground">{accounts.length} cuenta{accounts.length !== 1 ? "s" : ""}</p>
          </div>
          <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalBalance)}
          </p>
        </div>
      )}

      {isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-1.5 w-full rounded-none" />
              <CardHeader className="flex flex-row items-start justify-between pb-2 pt-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="size-8 rounded-md" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="mt-2 h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : accounts.length === 0 && !accountsQuery.isError ? (
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
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Mis cuentas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {accounts.map((account) => (
            <Card key={account.id} className="overflow-hidden">
              <div className="h-1.5 w-full" style={{ backgroundColor: account.color }} />
              <CardHeader className="flex flex-row items-start justify-between pb-2 pt-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-base">{account.name}</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">PEN</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground">
                      <MoreHorizontalIcon />
                      <span className="sr-only">Acciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditAccount(account)}>
                      <PencilIcon />
                      Editar
                    </DropdownMenuItem>
                    {accounts.length >= 2 && (
                      <DropdownMenuItem
                        onSelect={() => {
                          setTransferFromId(account.id)
                          setTransferOpen(true)
                        }}
                      >
                        <ArrowLeftRightIcon />
                        Transferir
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => setDeleteId(account.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2Icon />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(account.balance)}
                </p>
                {account.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">{account.notes}</p>
                )}
              </CardContent>
            </Card>
            ))}
          </div>
        </section>
      )}

      {transfers.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Transferencias recientes</h2>
            <Button variant="outline" size="sm" onClick={() => setCsvConfirmOpen(true)}>
              <DownloadIcon className="size-3.5" />
              Exportar CSV
            </Button>
          </div>
          <Card>
            <CardContent className="divide-y p-0">
              {transfers.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {t.fromAccountName} → {t.toAccountName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDate(t.occurredOn)}
                      {t.notes && ` · ${t.notes}`}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums text-destructive">
                    -{formatCurrency(t.amount)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {editAccount && (
        <EditAccountDialog
          account={editAccount}
          open={!!editAccount}
          onOpenChange={(o) => !o && setEditAccount(null)}
        />
      )}

      <TransferDialog
        accounts={accounts}
        open={transferOpen}
        onOpenChange={(o) => { setTransferOpen(o); if (!o) setTransferFromId(undefined) }}
        defaultFromAccountId={transferFromId}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Eliminar cuenta"
        description="Se eliminará la cuenta y su historial de transferencias. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />

      <AlertDialog open={csvConfirmOpen} onOpenChange={setCsvConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exportar transferencias</AlertDialogTitle>
            <AlertDialogDescription>
              Se descargará un archivo CSV con {transfers.length} transferencia{transfers.length !== 1 ? "s" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                exportTransfersCSV(transfers, `gastly-transferencias-${format(new Date(), "yyyy-MM-dd")}.csv`)
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
