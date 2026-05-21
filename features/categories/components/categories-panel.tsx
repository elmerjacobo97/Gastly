"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  MoreHorizontalIcon,
  PencilIcon,
  TagsIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
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
import { CategoryIconBadge } from "@/features/categories/components/category-icon"
import { CategoryDialog } from "@/features/categories/components/category-dialog"
import {
  createSuggestedCategories,
  deleteCategory,
  getCategories,
} from "@/features/categories/lib/categories-api"
import { type Category } from "@/features/categories/types/category-types"
import { SegmentedControl } from "@/components/ui/segmented-control"

type TypeFilter = "all" | "expense" | "income"

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
]

export function CategoriesPanel({ embedded = false }: { embedded?: boolean }) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      setDeleteId(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ])
      toast.success("Categoría eliminada")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar la categoría", { description: error.message })
    },
  })

  const suggestedMutation = useMutation({
    mutationFn: createSuggestedCategories,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Categorías sugeridas creadas")
    },
    onError: (error) => {
      toast.error("No se pudieron crear las categorías", { description: error.message })
    },
  })

  const categories = categoriesQuery.data ?? []
  const filtered =
    typeFilter === "all" ? categories : categories.filter((c) => c.type === typeFilter)

  const Wrapper = embedded ? "div" : "main"

  return (
    <Wrapper className={embedded ? "flex flex-col gap-6" : "flex flex-1 flex-col gap-6 p-4 md:p-6"}>
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

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Todas las categorías</CardTitle>
            <CardDescription>
              {filtered.length} categoría{filtered.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <SegmentedControl value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
        </CardHeader>
        <CardContent>
          {categoriesQuery.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Empty className="bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TagsIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {typeFilter === "all"
                    ? "Sin categorías aún"
                    : typeFilter === "expense"
                      ? "Sin categorías de gastos"
                      : "Sin categorías de ingresos"}
                </EmptyTitle>
                <EmptyDescription>
                  Crea categorías para clasificar tus movimientos de forma consistente.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    disabled={suggestedMutation.isPending}
                    onClick={() => suggestedMutation.mutate()}
                  >
                    Crear categorías sugeridas
                  </Button>
                  <CategoryDialog />
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((category) => (
                <div
                  key={category.id}
                  className="group flex items-center gap-3 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <CategoryIconBadge icon={category.icon} color={category.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.type === "expense" ? "Gasto" : "Ingreso"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                      >
                        <MoreHorizontalIcon />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditCategory(category)}>
                        <PencilIcon />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => setDeleteId(category.id)}
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

      <CategoryDialog
        category={editCategory ?? undefined}
        open={!!editCategory}
        onOpenChange={(o) => !o && setEditCategory(null)}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        description="Se eliminará esta categoría. Las transacciones asociadas quedarán sin categoría."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </Wrapper>
  )
}
