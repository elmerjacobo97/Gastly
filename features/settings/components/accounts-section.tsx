"use client"

import { AlertTriangleIcon, MoreHorizontalIcon, PencilIcon, RefreshCwIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateAccountDialog } from "@/features/accounts/components/create-account-dialog"
import { EditAccountDialog } from "@/features/accounts/components/edit-account-dialog"
import { useAccounts } from "@/features/accounts/hooks/queries"
import { useDeleteAccount } from "@/features/accounts/hooks/mutations"
import { type Account } from "@/features/accounts/types/account-types"
import { formatCurrency } from "@/lib/format"

export function AccountsSection() {
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const accountsQuery = useAccounts()
  const accounts = accountsQuery.data ?? []
  const isLoading = accountsQuery.isLoading
  const deleteMutation = useDeleteAccount()

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Cuentas y tarjetas</CardTitle>
            <CardDescription>
              Las cuentas se usan para clasificar cuotas y pagos recurrentes.
            </CardDescription>
          </div>
          <CreateAccountDialog />
        </CardHeader>
        <CardContent>
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
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="size-2.5 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="size-7 rounded-md" />
                </div>
              ))}
            </div>
          ) : accounts.length === 0 && !accountsQuery.isError ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin cuentas registradas.
            </p>
          ) : (
            <div className="flex flex-col divide-y">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: account.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{account.name}</span>
                    {account.notes && (
                      <span className="ml-2 text-xs text-muted-foreground">{account.notes}</span>
                    )}
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(account.balance)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground">
                        <MoreHorizontalIcon className="size-4" />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditAccount(account)}>
                        <PencilIcon />
                        Editar
                      </DropdownMenuItem>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editAccount && (
        <EditAccountDialog
          account={editAccount}
          open={!!editAccount}
          onOpenChange={(o) => !o && setEditAccount(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Eliminar cuenta"
        description="Se eliminará la cuenta. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </>
  )
}
