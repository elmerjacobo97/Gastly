"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CategoryIcon,
  categoryIconOptions,
} from "@/components/category-icon-badge"
import { useCreateCategory } from "@/lib/finance/categories/hooks/mutations"
import {
  type CategoryValues,
  categorySchema,
} from "@/lib/finance/categories/schemas/category-schemas"
import { type TransactionType } from "@/lib/finance/transactions/schemas/transaction-schemas"
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

  const mutation = useCreateCategory()

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
                form.handleSubmit((v) => mutation.mutate(v, {
                  onSuccess: (data, values) => { onCreated(data.id, values.name); onOpenChange(false) },
                }))(e)
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
                      <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                        {colorOptions.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              "rounded-full hover:bg-transparent hover:scale-110",
                              selectedColor === option.value &&
                                "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            )}
                            style={{ backgroundColor: option.hex }}
                            title={option.value}
                          >
                            {selectedColor === option.value && (
                              <CheckIcon className="size-3.5 text-white drop-shadow-sm" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Ícono</FieldLabel>
                      <TooltipProvider>
                        <div className="grid grid-cols-5 gap-2 rounded-lg border p-3 sm:grid-cols-6">
                          {categoryIconOptions.map((option) => (
                            <Tooltip key={option.value}>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-lg"
                                  onClick={() => field.onChange(option.value)}
                                  className={cn(
                                    "border text-muted-foreground hover:bg-muted hover:text-foreground",
                                    selectedIcon === option.value &&
                                      "border-primary bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                                  )}
                                >
                                  <CategoryIcon name={option.value} className="size-4" />
                                  <span className="sr-only">{option.label}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{option.label}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TooltipProvider>
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
          <Button disabled={mutation.isPending} form="quick-create-category-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Crear categoría
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
