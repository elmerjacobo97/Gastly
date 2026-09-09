"use client"

import {
  TagsIcon,
} from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryIconBadge } from "@/components/category-icon-badge"
import { RowActionsMenu } from "@/components/row-actions-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { CreateCategoryDialog } from "@/features/categories/components/create-category-dialog"
import { EditCategoryDialog } from "@/features/categories/components/edit-category-dialog"
import { deleteCategory } from "@/features/categories/server/actions"
import { type Category } from "@/features/categories/types/category-types"

type TypeFilter = "all" | "expense" | "income"

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
]

type CategoriesPanelProps = {
  categories: Category[]
  embedded?: boolean
}

export function CategoriesPanel({ categories, embedded = false }: CategoriesPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered =
    typeFilter === "all" ? categories : categories.filter((c) => c.type === typeFilter)

  const Wrapper = embedded ? "div" : "main"

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteCategory(id)
        toast.success("Categoría eliminada")
        setDeleteId(null)
      } catch (error) {
        toast.error("No se pudo eliminar la categoría", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  return (
    <Wrapper className={embedded ? "flex flex-col gap-6" : "flex flex-1 flex-col gap-6 p-4 md:p-6"}>
      {!embedded && (
        <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Categorías
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organiza gastos e ingresos con categorías reutilizables.
            </p>
          </div>
          <CreateCategoryDialog />
        </section>
      )}

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
          {filtered.length === 0 ? (
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
                  Crea categorías para clasificar tus transacciones de forma consistente.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CreateCategoryDialog />
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <CategoryIconBadge icon={category.icon} color={category.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.type === "expense" ? "Gasto" : "Ingreso"}
                    </p>
                  </div>
                  <RowActionsMenu
                    onEdit={() => setEditCategory(category)}
                    onDelete={() => setDeleteId(category.id)}
                    className="shrink-0 text-muted-foreground"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editCategory && (
        <EditCategoryDialog
          category={editCategory}
          open={Boolean(editCategory)}
          onOpenChange={(o) => !o && setEditCategory(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        description="Se eliminará esta categoría. Las transacciones asociadas quedarán sin categoría."
        pending={isPending}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </Wrapper>
  )
}
