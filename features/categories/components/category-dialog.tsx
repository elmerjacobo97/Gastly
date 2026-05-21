"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CategoryIcon,
  categoryIconOptions,
} from "@/features/categories/components/category-icon"
import {
  createCategory,
  updateCategory,
} from "@/features/categories/lib/categories-api"
import {
  type CategoryValues,
  categorySchema,
} from "@/features/categories/schemas/category-schemas"
import { type Category } from "@/features/categories/types/category-types"
import { cn } from "@/lib/utils"

const colorOptions = [
  { value: "red", hex: "#ef4444" },
  { value: "orange", hex: "#f97316" },
  { value: "amber", hex: "#f59e0b" },
  { value: "yellow", hex: "#eab308" },
  { value: "lime", hex: "#84cc16" },
  { value: "green", hex: "#22c55e" },
  { value: "emerald", hex: "#10b981" },
  { value: "teal", hex: "#14b8a6" },
  { value: "cyan", hex: "#06b6d4" },
  { value: "sky", hex: "#0ea5e9" },
  { value: "blue", hex: "#3b82f6" },
  { value: "indigo", hex: "#6366f1" },
  { value: "violet", hex: "#8b5cf6" },
  { value: "purple", hex: "#a855f7" },
  { value: "pink", hex: "#ec4899" },
  { value: "rose", hex: "#f43f5e" },
  { value: "slate", hex: "#64748b" },
  { value: "zinc", hex: "#71717a" },
]

type CategoryDialogProps = {
  category?: Category
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CategoryDialog({
  category,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CategoryDialogProps) {
  const isEditing = !!category
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen

  const queryClient = useQueryClient()

  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      type: category?.type ?? "expense",
      color: category?.color ?? "blue",
      icon: category?.icon ?? "tag",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? "",
        type: category?.type ?? "expense",
        color: category?.color ?? "blue",
        icon: category?.icon ?? "tag",
      })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] }),
      queryClient.invalidateQueries({ queryKey: ["budgets"] }),
      queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
    ])

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      await invalidate()
      form.reset({ name: "", type: "expense", color: "blue", icon: "tag" })
      setOpen(false)
      toast.success("Categoría creada")
    },
    onError: (error) => {
      toast.error("No se pudo crear la categoría", { description: error.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: CategoryValues) =>
      updateCategory(category!.id, values),
    onSuccess: async () => {
      await invalidate()
      setOpen(false)
      toast.success("Categoría actualizada")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar la categoría", { description: error.message })
    },
  })

  const mutation = isEditing ? updateMutation : createMutation
  const selectedColor = form.watch("color")
  const selectedIcon = form.watch("icon")

  function onSubmit(values: CategoryValues) {
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <PlusIcon data-icon="inline-start" />
            <span className="hidden sm:inline">Nueva categoría</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cambia el nombre o el color de la categoría."
              : "Crea una categoría para clasificar tus gastos o ingresos."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          id="category-form"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="category-name">Nombre</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="category-name"
                    placeholder="Ej. Comida, sueldo, transporte"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="category-type">Tipo</FieldLabel>
                  <NativeSelect
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="w-full"
                    disabled={isEditing}
                    id="category-type"
                  >
                    <NativeSelectOption value="expense">Gasto</NativeSelectOption>
                    <NativeSelectOption value="income">Ingreso</NativeSelectOption>
                  </NativeSelect>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="color"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Color</FieldLabel>
                  <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          "grid size-7 place-items-center rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selectedColor === option.value &&
                            "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                        )}
                        style={{ background: option.hex }}
                        title={option.value}
                      >
                        {selectedColor === option.value && (
                          <CheckIcon className="size-3.5 text-white drop-shadow-sm" />
                        )}
                      </button>
                    ))}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="icon"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Icono</FieldLabel>
                  <TooltipProvider>
                    <div className="grid grid-cols-5 gap-2 rounded-lg border p-3 sm:grid-cols-6">
                      {categoryIconOptions.map((option) => (
                        <Tooltip key={option.value}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => field.onChange(option.value)}
                              className={cn(
                                "grid size-9 place-items-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                selectedIcon === option.value &&
                                  "border-foreground bg-muted text-foreground"
                              )}
                            >
                              <CategoryIcon name={option.value} className="size-4" />
                              <span className="sr-only">{option.label}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{option.label}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button disabled={mutation.isPending} form="category-form" type="submit">
            {mutation.isPending && (
              <Loader2Icon className="size-4 animate-spin" />
            )}
            {isEditing ? "Guardar cambios" : "Guardar categoría"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
