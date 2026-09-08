"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { useState } from "react"
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

const EMPTY_DEFAULTS: CategoryValues = { name: "", type: "expense", color: "blue", icon: "tag" }

export function CreateCategoryDialog() {
  const [open, setOpen] = useState(false)

  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  const selectedColor = useWatch({ control: form.control, name: "color" })
  const selectedIcon = useWatch({ control: form.control, name: "icon" })

  const mutation = useCreateCategory()

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
              onSubmit={form.handleSubmit((v) => mutation.mutate(v, {
                onSuccess: () => { form.reset(EMPTY_DEFAULTS); setOpen(false) },
              }))}
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
          <Button disabled={mutation.isPending} form="create-category-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar categoría
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
