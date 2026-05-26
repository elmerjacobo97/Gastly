"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowLeftRightIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  WalletIcon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { deleteAccount, getAccountTransfers, getAccounts } from "@/features/accounts/lib/accounts-api"
import { type Account, type AccountCurrency, type AccountTransfer } from "@/features/accounts/types/account-types"
import { formatCurrency, formatDate } from "@/lib/format"

const CURRENCY_ORDER: AccountCurrency[] = ["PEN", "USD", "MXN"]

function exportTransfersCSV(transfers: AccountTransfer[], filename: string) {
  const headers = ["Fecha", "Origen", "Destino", "Monto enviado", "Moneda origen", "Monto recibido", "Moneda destino", "Notas"]
  const rows = transfers.map((t) => [
    t.occurredOn,
    t.fromAccountName,
    t.toAccountName,
    t.fromAmount.toString(),
    t.fromCurrency,
    t.toAmount.toString(),
    t.toCurrency,
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
  const queryClient = useQueryClient()

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  })

  const { data: transfers = [] } = useQuery({
    queryKey: ["account-transfers"],
    queryFn: () => getAccountTransfers(),
    enabled: accounts.length > 0,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      setDeleteId(null)
      await queryClient.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Cuenta eliminada")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar la cuenta", { description: error.message })
    },
  })

  const totalByAll = CURRENCY_ORDER.map((currency) => {
    const total = accounts.filter((a) => a.currency === currency).reduce((s, a) => s + a.balance, 0)
    return { currency, total }
  }).filter((x) => x.total > 0)

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

      {!isLoading && totalByAll.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {totalByAll.map(({ currency, total }) => (
            <div key={currency} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total en {currency}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatCurrency(total, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {accounts.filter((a) => a.currency === currency).length} cuenta{accounts.filter((a) => a.currency === currency).length !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-1 h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28" />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : accounts.length === 0 ? (
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="truncate text-base">{account.name}</CardTitle>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{account.currency}</p>
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
                  {formatCurrency(account.balance, account.currency)}
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
                    <p className="text-xs text-muted-foreground">
                      {formatDate(t.occurredOn)}
                      {t.notes && ` · ${t.notes}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <p className="text-sm font-medium text-destructive">
                      -{formatCurrency(t.fromAmount, t.fromCurrency)}
                    </p>
                    {t.fromCurrency !== t.toCurrency && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(t.toAmount, t.toCurrency)}
                      </p>
                    )}
                  </div>
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
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
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
