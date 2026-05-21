"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { TagsIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { CategoryDialog } from "@/features/categories/components/category-dialog"
import {
  deleteCategory,
  getCategories,
} from "@/features/categories/lib/categories-api"

const COLOR_MAP: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
  gray: "#6b7280",
  slate: "#64748b",
  zinc: "#71717a",
}

function getColorHex(color: string): string {
  return COLOR_MAP[color.toLowerCase()] ?? color
}

export function CategoriesPanel() {
  const queryClient = useQueryClient()
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  })
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["transaction-summary"] }),
      ])
      toast.success("Categoría eliminada")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar la categoría", {
        description: error.message,
      })
    },
  })
  const categories = categoriesQuery.data ?? []
  const expenseCategories = categories.filter((c) => c.type === "expense")
  const incomeCategories = categories.filter((c) => c.type === "income")

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Categorías
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organiza gastos e ingresos con categorías reutilizables.
          </p>
        </div>
        <CategoryDialog />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorías de gastos</CardTitle>
            <CardDescription>
              {expenseCategories.length} categoría
              {expenseCategories.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoriesQuery.isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : expenseCategories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="size-3 shrink-0 rounded-full"
                            style={{
                              background: getColorHex(category.color),
                            }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(category.id)}
                          size="icon-sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2Icon />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Sin categorías de gastos
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorías de ingresos</CardTitle>
            <CardDescription>
              {incomeCategories.length} categoría
              {incomeCategories.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoriesQuery.isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : incomeCategories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="size-3 shrink-0 rounded-full"
                            style={{
                              background: getColorHex(category.color),
                            }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(category.id)}
                          size="icon-sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2Icon />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Sin categorías de ingresos
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {!categoriesQuery.isLoading && categories.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TagsIcon />
                </EmptyMedia>
                <EmptyTitle>Sin categorías aún</EmptyTitle>
                <EmptyDescription>
                  Crea categorías para clasificar tus movimientos de forma consistente.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CategoryDialog />
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
