import {
  ArrowLeftRightIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Account } from "@/features/accounts/types/account-types"
import { formatCurrency } from "@/lib/format"

type AccountsGridProps = {
  accounts: Account[]
  onEdit: (account: Account) => void
  onTransfer: (accountId: string) => void
  onDelete: (id: string) => void
}

export function AccountsGrid({ accounts, onEdit, onTransfer, onDelete }: AccountsGridProps) {
  return (
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
                  <DropdownMenuItem onSelect={() => onEdit(account)}>
                    <PencilIcon />
                    Editar
                  </DropdownMenuItem>
                  {accounts.length >= 2 && (
                    <DropdownMenuItem onSelect={() => onTransfer(account.id)}>
                      <ArrowLeftRightIcon />
                      Transferir
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => onDelete(account.id)}
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
  )
}
