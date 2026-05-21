"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { useState } from "react"
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
import { createCategory } from "@/features/categories/lib/categories-api"
import {
  type CategoryValues,
  categorySchema,
} from "@/features/categories/schemas/category-schemas"
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

export function CategoryDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "expense",
      color: "blue",
    },
  })
  const mutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ])
      form.reset({ name: "", type: "expense", color: "blue" })
      setOpen(false)
      toast.success("Categoría creada")
    },
    onError: (error) => {
      toast.error("No se pudo crear la categoría", {
        description: error.message,
      })
    },
  })

  function onSubmit(values: CategoryValues) {
    mutation.mutate(values)
  }

  const selectedColor = form.watch("color")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          Nueva categoría
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva categoría</DialogTitle>
          <DialogDescription>
            Crea una categoría para clasificar tus gastos o ingresos.
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
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button
            disabled={mutation.isPending}
            form="category-form"
            type="submit"
          >
            {mutation.isPending && (
              <Loader2Icon className="size-4 animate-spin" />
            )}
            Guardar categoría
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
