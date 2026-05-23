"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addMonths, format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogClose,
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
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CategoryCombobox } from "@/features/categories/components/category-combobox"
import {
  installmentPurchaseSchema,
  type InstallmentPurchaseValues,
} from "@/features/installments/schemas/installment-schemas"
import { createInstallmentPurchase } from "@/features/installments/lib/installments-api"

function getNextPaymentDefault(): string {
  const today = new Date()
  const candidate = new Date(today.getFullYear(), today.getMonth(), 20)
  if (today.getDate() > 20) candidate.setMonth(candidate.getMonth() + 1)
  return format(candidate, "yyyy-MM-dd")
}

function getLastPaymentDate(firstPaymentOn: string, totalInstallments: number): string | null {
  if (!firstPaymentOn || !totalInstallments || totalInstallments < 2) return null
  try {
    const first = new Date(`${firstPaymentOn}T12:00:00`)
    return format(addMonths(first, totalInstallments - 1), "MMMM yyyy", { locale: es })
  } catch {
    return null
  }
}

type InstallmentDialogProps = {
  triggerLabel?: string
}

export function InstallmentDialog({ triggerLabel = "Nueva compra en cuotas" }: InstallmentDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<InstallmentPurchaseValues>({
    resolver: zodResolver(installmentPurchaseSchema),
    defaultValues: {
      description: "",
      categoryId: "",
      totalAmount: 0,
      interestAmount: 0,
      totalInstallments: 6,
      firstPaymentOn: getNextPaymentDefault(),
      alreadyPaid: 0 as number,
      notes: "",
    },
  })

  const mutation = useMutation({
    mutationFn: createInstallmentPurchase,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["installments"] })
      form.reset({
        description: "",
        categoryId: "",
        totalAmount: 0,
        interestAmount: 0,
        totalInstallments: 6,
        firstPaymentOn: getNextPaymentDefault(),
        alreadyPaid: 0 as number,
        notes: "",
      })
      setOpen(false)
      toast.success("Compra en cuotas registrada")
    },
    onError: (error) => {
      toast.error("No se pudo registrar", { description: error.message })
    },
  })

  const totalAmount = useWatch({ control: form.control, name: "totalAmount" })
  const interestAmount = useWatch({ control: form.control, name: "interestAmount" })
  const totalInstallments = useWatch({ control: form.control, name: "totalInstallments" })
  const firstPaymentOn = useWatch({ control: form.control, name: "firstPaymentOn" })
  const alreadyPaid = useWatch({ control: form.control, name: "alreadyPaid" })

  const interest = Number(interestAmount) || 0
  const total = (Number(totalAmount) || 0) + interest
  const installmentAmount =
    total > 0 && totalInstallments > 0
      ? Math.round((total / totalInstallments) * 100) / 100
      : 0
  const lastPaymentLabel = getLastPaymentDate(firstPaymentOn, totalInstallments)
  const remaining = totalInstallments - (alreadyPaid ?? 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          <span className="hidden sm:inline">{triggerLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva compra en cuotas</DialogTitle>
          <DialogDescription>
            Registra una compra financiada. El sistema generará las cuotas automáticamente.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-4 min-h-0">
          <div className="px-4 pb-1">
            <form
              id="installment-form"
              className="flex flex-col gap-5"
              noValidate
              onSubmit={form.handleSubmit((v) => mutation.mutate(v as InstallmentPurchaseValues))}
            >
              <FieldGroup>
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="inst-description">Descripción</FieldLabel>
                  <Input
                    {...field}
                    id="inst-description"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Camisa Mercado Libre"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="inst-category">Categoría</FieldLabel>
                  <CategoryCombobox
                    id="inst-category"
                    value={field.value}
                    onChange={field.onChange}
                    type="expense"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="totalAmount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="inst-total">Precio original</FieldLabel>
                    <NumberInput
                      {...field}
                      id="inst-total"
                      aria-invalid={fieldState.invalid}
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="interestAmount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="inst-interest">
                      Intereses <span className="font-normal text-muted-foreground">(opc.)</span>
                    </FieldLabel>
                    <NumberInput
                      {...field}
                      id="inst-interest"
                      aria-invalid={fieldState.invalid}
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="totalInstallments"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="inst-count">Cuotas</FieldLabel>
                    <NumberInput
                      {...field}
                      id="inst-count"
                      aria-invalid={fieldState.invalid}
                      inputMode="numeric"
                      min="2"
                      max="60"
                      placeholder="6"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Field>
                <FieldLabel>Total a pagar</FieldLabel>
                <Input
                  readOnly
                  disabled
                  value={total > 0 ? `S/ ${total.toFixed(2)}` : ""}
                  placeholder="—"
                  className="tabular-nums"
                />
              </Field>
            </div>

            {installmentAmount > 0 && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Por cuota: </span>
                <span className="font-semibold">S/ {installmentAmount.toFixed(2)}</span>
                {interest > 0 && (
                  <span className="text-muted-foreground"> · Intereses: S/ {interest.toFixed(2)}</span>
                )}
                {lastPaymentLabel && (
                  <span className="text-muted-foreground"> · Último pago: {lastPaymentLabel}</span>
                )}
              </div>
            )}

            <Controller
              control={form.control}
              name="firstPaymentOn"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="inst-first-payment">Fecha del primer pago</FieldLabel>
                  <DatePicker
                    id="inst-first-payment"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="alreadyPaid"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="inst-already-paid">
                    Cuotas ya pagadas{" "}
                    <span className="font-normal text-muted-foreground">(para compras en curso)</span>
                  </FieldLabel>
                  <NumberInput
                    {...field}
                    id="inst-already-paid"
                    aria-invalid={fieldState.invalid}
                    inputMode="numeric"
                    min="0"
                    placeholder="0"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  {remaining > 0 && (alreadyPaid ?? 0) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Quedan {remaining} cuota{remaining !== 1 ? "s" : ""} por pagar.
                    </p>
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="inst-notes">
                    Notas <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="inst-notes"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Comprado en Saga, sin intereses"
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
          <Button disabled={mutation.isPending} form="installment-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Registrar compra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
