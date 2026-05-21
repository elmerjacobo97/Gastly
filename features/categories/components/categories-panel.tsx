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

function getTypeLabel(type: "expense" | "income") {
  return type === "expense" ? "Gasto" : "Ingreso"
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
      toast.success("Categoria eliminada")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar la categoria", {
        description: error.message,
      })
    },
  })
  const categories = categoriesQuery.data ?? []

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Categorias
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organiza gastos e ingresos con categorias reutilizables.
          </p>
        </div>
        <CategoryDialog />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Listado de categorias</CardTitle>
          <CardDescription>
            Estas categorias se usan al registrar movimientos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant={category.type === "income" ? "default" : "secondary"}>
                        {getTypeLabel(category.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{category.color}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(category.id)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Trash2Icon />
                        <span className="sr-only">Eliminar categoria</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TagsIcon />
                </EmptyMedia>
                <EmptyTitle>Aun no tienes categorias</EmptyTitle>
                <EmptyDescription>
                  Crea categorias para clasificar tus movimientos de forma consistente.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CategoryDialog />
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
