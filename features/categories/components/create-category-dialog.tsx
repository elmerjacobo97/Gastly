"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Controller, useForm, useWatch } from "react-hook-form"

import { CategoryIconPicker } from "@/components/category-icon-picker"
import { ColorPicker } from "@/components/color-picker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { createCategory } from "@/features/categories/server/actions"
import {
  type CategoryValues,
  categorySchema,
} from "@/features/categories/schemas/category-schemas"

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

const EMPTY_DEFAULTS: CategoryValues = { name: "", type: "expense", color: "blue", icon: "tag" }

export function CreateCategoryDialog() {
  const [open, setOpen] = useState(false)

  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  const selectedColor = useWatch({ control: form.control, name: "color" })
  const selectedIcon = useWatch({ control: form.control, name: "icon" })

  const [isPending, startTransition] = useTransition()

  function onSubmit(values: CategoryValues) {
    startTransition(async () => {
      try {
        await createCategory(values)
        toast.success("Categoría creada")
        form.reset(EMPTY_DEFAULTS)
        setOpen(false)
      } catch (error) {
        toast.error("No se pudo crear la categoría", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          <span className="hidden sm:inline">Nueva categoría</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader>
          <DialogTitle>Nueva categoría</DialogTitle>
          <DialogDescription>
            Crea una categoría para clasificar tus gastos o ingresos.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-4 min-h-0">
          <div className="px-4 pb-1">
            <form
              className="flex flex-col gap-5"
              id="create-category-form"
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
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="color"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Color</FieldLabel>
                       <ColorPicker
                         options={colorOptions}
                         value={selectedColor}
                         onChange={field.onChange}
                       />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="icon"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Icono</FieldLabel>
                       <CategoryIconPicker
                         value={selectedIcon}
                         onChange={field.onChange}
                       />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancelar</Button>
          </DialogClose>
          <Button disabled={isPending} form="create-category-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar categoría
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
