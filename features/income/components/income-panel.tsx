"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CircleDollarSignIcon, PencilIcon, SearchIcon, Trash2Icon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TransactionDialog } from "@/features/transactions/components/transaction-dialog"
import { MonthNav } from "@/features/transactions/components/month-nav"
import {
  deleteTransaction,
  getTransactions,
} from "@/features/transactions/lib/transactions-api"
import {
  formatCurrency,
  formatDate,
} from "@/features/transactions/lib/format-transaction"

export function IncomePanel() {
  const [month, setMonth] = useState(() => new Date())
  const [search, setSearch] = useState("")
  const queryClient = useQueryClient()

  const incomeQuery = useQuery({
    queryKey: ["transactions", "income", month.toISOString().slice(0, 7)],
    queryFn: () => getTransactions({ type: "income", month }),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["category-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
      ])
      toast.success("Ingreso eliminado")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar", { description: error.message })
    },
  })

  const income = incomeQuery.data ?? []
  const total = income.reduce((sum, i) => sum + i.amount, 0)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return income
    return income.filter(
      (i) =>
        i.description.toLowerCase().includes(q) ||
        (i.category?.name ?? "").toLowerCase().includes(q)
    )
  }, [income, search])

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Ingresos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra y revisa todos tus entradas de dinero.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav value={month} onChange={setMonth} />
          <TransactionDialog
            defaultType="income"
            lockType
            triggerLabel="Nuevo ingreso"
          />
        </div>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Ingresos del mes</CardTitle>
            <CardDescription>
              {filtered.length} de {income.length} registro{income.length !== 1 ? "s" : ""} ·{" "}
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(total)}
              </span>
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-56">
            <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {incomeQuery.isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : income.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.category?.name ?? "Sin categoría"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(item.occurredOn)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <TransactionDialog
                          transaction={item}
                          trigger={
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <PencilIcon className="size-3.5" />
                              <span className="sr-only">Editar</span>
                            </Button>
                          }
                        />
                        <ConfirmDialog
                          trigger={
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2Icon className="size-3.5" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          }
                          description="Se eliminará este ingreso permanentemente."
                          onConfirm={() => deleteMutation.mutate(item.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CircleDollarSignIcon />
                </EmptyMedia>
                <EmptyTitle>Sin ingresos este mes</EmptyTitle>
                <EmptyDescription>
                  Registra tu primer ingreso para comenzar a controlar tus entradas.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <TransactionDialog
                  defaultType="income"
                  lockType
                  triggerLabel="Agregar ingreso"
                />
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
