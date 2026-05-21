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

import { Badge } from "@/components/ui/badge"
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
import { CategoryDialog } from "@/features/categories/components/category-dialog"
import {
  deleteCategory,
  getCategories,
} from "@/features/categories/lib/categories-api"
import { type Category } from "@/features/categories/types/category-types"
import { cn } from "@/lib/utils"

type TypeFilter = "all" | "expense" | "income"

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
]

const COLOR_MAP: Record<string, string> = {
  red: "#ef4444", orange: "#f97316", amber: "#f59e0b", yellow: "#eab308",
  lime: "#84cc16", green: "#22c55e", emerald: "#10b981", teal: "#14b8a6",
  cyan: "#06b6d4", sky: "#0ea5e9", blue: "#3b82f6", indigo: "#6366f1",
  violet: "#8b5cf6", purple: "#a855f7", pink: "#ec4899", rose: "#f43f5e",
  fuchsia: "#d946ef", slate: "#64748b", zinc: "#71717a", gray: "#6b7280",
}

function getColorHex(color: string) {
  return COLOR_MAP[color.toLowerCase()] ?? color
}

export function CategoriesPanel() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
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

  const categories = categoriesQuery.data ?? []
  const filtered =
    typeFilter === "all" ? categories : categories.filter((c) => c.type === typeFilter)

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

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Todas las categorías</CardTitle>
            <CardDescription>
              {filtered.length} categoría{filtered.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex rounded-md border p-0.5 gap-0.5">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  opt.value === typeFilter
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {categoriesQuery.isLoading ? (
            <div className="flex flex-col divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="size-3 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="ml-auto h-5 w-14 rounded-full" />
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
                <CategoryDialog />
              </EmptyContent>
            </Empty>
          ) : (
            <div className="flex flex-col divide-y">
              {filtered.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: getColorHex(category.color) }}
                  />
                  <span className="flex-1 text-sm font-medium">{category.name}</span>
                  {typeFilter === "all" && (
                    <Badge variant="secondary" className="text-xs">
                      {category.type === "expense" ? "Gasto" : "Ingreso"}
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground data-[state=open]:bg-muted"
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
    </main>
  )
}
