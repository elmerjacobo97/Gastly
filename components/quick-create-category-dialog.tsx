"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { useEffect, useTransition } from "react"
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
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createCategory } from "@/features/categories/server/actions"
import {
  type CategoryValues,
  categorySchema,
} from "@/features/categories/schemas/category-schemas"
import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"

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

type QuickCreateCategoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType: TransactionType
  initialName?: string
  onCreated: (id: string, name: string) => void
}

export function QuickCreateCategoryDialog({
  open,
  onOpenChange,
  defaultType,
  initialName = "",
  onCreated,
}: QuickCreateCategoryDialogProps) {
  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: initialName, type: defaultType, color: "blue", icon: "tag" },
  })

  useEffect(() => {
    if (open) {
      form.reset({ name: initialName, type: defaultType, color: "blue", icon: "tag" })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedColor = useWatch({ control: form.control, name: "color" })
  const selectedIcon = useWatch({ control: form.control, name: "icon" })

  const [isPending, startTransition] = useTransition()

  function onSubmit(values: CategoryValues) {
    startTransition(async () => {
      try {
        const id = await createCategory(values)
        toast.success("Categoría creada")
        onCreated(id, values.name)
        onOpenChange(false)
      } catch (error) {
        toast.error("No se pudo crear la categoría", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader>
          <DialogTitle>Nueva categoría</DialogTitle>
          <DialogDescription>
            {defaultType === "expense" ? "Categoría de gasto" : "Categoría de ingreso"} — se seleccionará automáticamente.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-4 min-h-0">
          <div className="px-4 pb-1">
            <form
              id="quick-create-category-form"
              className="flex flex-col gap-5"
              noValidate
              onSubmit={(e) => {
                e.stopPropagation()
                form.handleSubmit(onSubmit)(e)
              }}
            >
              <FieldGroup>
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="qc-name">Nombre</FieldLabel>
                      <Input
                        {...field}
                        id="qc-name"
                        aria-invalid={fieldState.invalid}
                        placeholder="Ej. Comida, transporte, sueldo"
                        autoFocus
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Color</FieldLabel>
                       <ColorPicker
                         options={colorOptions}
                         value={selectedColor}
                         onChange={field.onChange}
                       />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Ícono</FieldLabel>
                       <CategoryIconPicker
                         value={selectedIcon}
                         onChange={field.onChange}
                       />
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
          <Button disabled={isPending} form="quick-create-category-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Crear categoría
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
