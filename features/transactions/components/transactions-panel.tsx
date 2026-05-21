"use client"

import { useQuery } from "@tanstack/react-query"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarDaysIcon,
  ChartNoAxesColumnIncreasingIcon,
  WalletCardsIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import {
  getTransactionSummary,
  getTransactions,
} from "@/features/transactions/lib/transactions-api"
import { formatCurrency, formatDate } from "@/features/transactions/lib/format-transaction"
import { TransactionDialog } from "@/features/transactions/components/transaction-dialog"

type TransactionsPanelProps = {
  userEmail?: string
}

export function TransactionsPanel({ userEmail }: TransactionsPanelProps) {
  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getTransactions(),
  })
  const summaryQuery = useQuery({
    queryKey: ["transaction-summary"],
    queryFn: () => getTransactionSummary(),
  })
  const summary = summaryQuery.data ?? {
    balance: 0,
    income: 0,
    expenses: 0,
    budgetUsage: 0,
  }
  const summaryCards = [
    {
      title: "Balance del mes",
      value: formatCurrency(summary.balance),
      description: "Ingresos menos gastos",
      icon: WalletCardsIcon,
    },
    {
      title: "Ingresos",
      value: formatCurrency(summary.income),
      description: "Total registrado",
      icon: ArrowUpIcon,
    },
    {
      title: "Gastos",
      value: formatCurrency(summary.expenses),
      description: "Total registrado",
      icon: ArrowDownIcon,
    },
    {
      title: "Uso del ingreso",
      value: `${summary.budgetUsage}%`,
      description: "Gastos sobre ingresos",
      icon: ChartNoAxesColumnIncreasingIcon,
    },
  ]
  const transactions = transactionsQuery.data ?? []

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Badge className="w-fit" variant="secondary">
            Cuenta activa
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Panel de gastos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bienvenido {userEmail}. Registra movimientos y controla tu balance.
            </p>
          </div>
        </div>
        <TransactionDialog />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryQuery.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-7 w-28" />
                  </div>
                  <Skeleton className="size-10 rounded-xl" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))
          : summaryCards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardDescription>{card.title}</CardDescription>
                    <CardTitle className="mt-2 text-2xl">{card.value}</CardTitle>
                  </div>
                  <div className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <card.icon />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Movimientos recientes</CardTitle>
            <CardDescription>
              Ultimos gastos e ingresos registrados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsQuery.isLoading ? (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : transactions.length > 0 ? (
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
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        {transaction.category?.name ?? "Sin categoria"}
                      </TableCell>
                      <TableCell>{formatDate(transaction.occurredOn)}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            transaction.type === "income"
                              ? "text-foreground"
                              : "text-destructive"
                          }
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty className="border bg-muted/20">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <WalletCardsIcon />
                  </EmptyMedia>
                  <EmptyTitle>Aun no tienes movimientos</EmptyTitle>
                  <EmptyDescription>
                    Crea tu primer gasto o ingreso para empezar a ver resumenes reales.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <TransactionDialog />
                </EmptyContent>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen rapido</CardTitle>
            <CardDescription>Estado actual de tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                <CalendarDaysIcon />
              </div>
              <div>
                <p className="text-sm font-medium">Mes actual</p>
                <p className="text-sm text-muted-foreground">
                  {transactions.length} movimientos registrados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                <ChartNoAxesColumnIncreasingIcon />
              </div>
              <div>
                <p className="text-sm font-medium">Reportes</p>
                <p className="text-sm text-muted-foreground">
                  Disponibles al sumar mas movimientos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
