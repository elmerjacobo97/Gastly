"use client"

import { useQuery } from "@tanstack/react-query"
import { CreditCardIcon } from "lucide-react"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TransactionDialog } from "@/features/transactions/components/transaction-dialog"
import { getTransactions } from "@/features/transactions/lib/transactions-api"
import { formatCurrency, formatDate } from "@/features/transactions/lib/format-transaction"

export function ExpensesPanel() {
  const expensesQuery = useQuery({
    queryKey: ["transactions", "expense"],
    queryFn: () => getTransactions("expense"),
  })
  const expenses = expensesQuery.data ?? []

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Gastos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra y revisa todos tus egresos personales.
          </p>
        </div>
        <TransactionDialog
          defaultType="expense"
          lockType
          triggerLabel="Nuevo gasto"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Gastos recientes</CardTitle>
          <CardDescription>
            Ultimos egresos registrados en tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {expense.description}
                    </TableCell>
                    <TableCell>{expense.category?.name ?? "Sin categoria"}</TableCell>
                    <TableCell>{formatDate(expense.occurredOn)}</TableCell>
                    <TableCell className="text-right text-destructive">
                      -{formatCurrency(expense.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CreditCardIcon />
                </EmptyMedia>
                <EmptyTitle>Aun no tienes gastos</EmptyTitle>
                <EmptyDescription>
                  Crea tu primer gasto para empezar a controlar tus egresos.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <TransactionDialog
                  defaultType="expense"
                  lockType
                  triggerLabel="Agregar gasto"
                />
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
