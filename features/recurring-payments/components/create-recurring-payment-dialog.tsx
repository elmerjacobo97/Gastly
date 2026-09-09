"use client"

import { zodResolver } from "@hookform/resolvers/zod"
 import { format } from "date-fns"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { type Resolver, Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
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
import { NumberInput } from "@/components/ui/number-input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { AccountSelect } from "@/components/account-select"
import { CategorySelect } from "@/components/category-select"
import { createRecurringPayment } from "@/features/recurring-payments/server/actions"
import { type Account } from "@/features/accounts/types/account-types"
import { type Category } from "@/features/categories/types/category-types"
import {
  recurringPaymentSchema,
  type RecurringPaymentValues,
} from "@/features/recurring-payments/schemas/recurring-payment-schemas"

function buildDefaultValues(): RecurringPaymentValues {
  return {
    description: "",
    amount: 0,
    categoryId: "",
    frequency: "monthly",
    intervalMonths: 2,
    paymentKind: "fixed",
    nextDueOn: format(new Date(), "yyyy-MM-dd"),
    accountId: "",
    notes: "",
    type: "expense",
  }
}

type CreateRecurringPaymentDialogProps = {
  accounts: Account[]
  categories: Category[]
}

export function CreateRecurringPaymentDialog({
  accounts,
  categories,
}: CreateRecurringPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<RecurringPaymentValues>({
    resolver: zodResolver(recurringPaymentSchema) as Resolver<RecurringPaymentValues>,
    defaultValues: buildDefaultValues(),
  })

  const frequency = useWatch({ control: form.control, name: "frequency" })
  const type = useWatch({ control: form.control, name: "type" })

  function onSubmit(values: RecurringPaymentValues) {
    startTransition(async () => {
      try {
        await createRecurringPayment(values)
        toast.success("Pago recurrente creado")
        form.reset(buildDefaultValues())
        setOpen(false)
        router.refresh()
      } catch (error) {
        toast.error("No se pudo crear el pago recurrente", {
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
            <span className="hidden sm:inline">Nuevo pago recurrente</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo pago recurrente</DialogTitle>
            <DialogDescription>
              Registra pagos recurrentes con monto estimado. El monto real se define al pagar.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="-mx-4 min-h-0">
            <div className="px-4 pb-1">
              <form
                className="flex flex-col gap-5"
                id="create-recurring-payment-form"
                noValidate
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FieldGroup>
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="crp-type">Tipo</FieldLabel>
                        <NativeSelect {...field} aria-invalid={fieldState.invalid} id="crp-type">
                          <NativeSelectOption value="expense">Gasto recurrente</NativeSelectOption>
                          <NativeSelectOption value="income">Ingreso recurrente</NativeSelectOption>
                        </NativeSelect>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="crp-description">Nombre</FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="crp-description"
                          placeholder={type === "income" ? "Sueldo, Freelance" : "Disney+, Luz, Claude Code"}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="amount"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="crp-amount">Monto estimado (PEN)</FieldLabel>
                        <NumberInput
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="crp-amount"
                          inputMode="decimal"
                          min="0"
                          placeholder="0.00"
                          step="0.01"
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
                        <FieldLabel htmlFor="crp-category">Categoría</FieldLabel>
                           <CategorySelect
                             categories={categories}
                          id="crp-category"
                          value={field.value}
                          onChange={field.onChange}
                          type={type === "income" ? "income" : "expense"}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Controller
                      control={form.control}
                      name="frequency"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="crp-frequency">Frecuencia</FieldLabel>
                          <NativeSelect {...field} aria-invalid={fieldState.invalid} id="crp-frequency">
                            <NativeSelectOption value="monthly">Mensual</NativeSelectOption>
                            <NativeSelectOption value="custom_months">Cada X meses</NativeSelectOption>
                            <NativeSelectOption value="yearly">Anual</NativeSelectOption>
                          </NativeSelect>
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    {frequency === "custom_months" ? (
                      <Controller
                        control={form.control}
                        name="intervalMonths"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="crp-interval">Intervalo</FieldLabel>
                            <div className="relative">
                              <NumberInput
                                {...field}
                                aria-invalid={fieldState.invalid}
                                id="crp-interval"
                                inputMode="numeric"
                                min="1"
                                max="120"
                                className="w-full pr-16"
                              />
                              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                                meses
                              </span>
                            </div>
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    ) : (
                      <Field>
                        <FieldLabel>Intervalo</FieldLabel>
                        <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
                          {frequency === "yearly" ? "Cada 12 meses" : "Cada 1 mes"}
                        </div>
                      </Field>
                    )}
                  </div>
                  <Controller
                    control={form.control}
                    name="paymentKind"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="crp-kind">Tipo de monto</FieldLabel>
                        <NativeSelect {...field} aria-invalid={fieldState.invalid} id="crp-kind">
                          <NativeSelectOption value="fixed">Fijo</NativeSelectOption>
                          <NativeSelectOption value="variable">Variable</NativeSelectOption>
                        </NativeSelect>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="nextDueOn"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{type === "income" ? "Próxima fecha de cobro" : "Próxima fecha de pago"}</FieldLabel>
                        <DatePicker
                          id="crp-next-due"
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
                    name="accountId"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="crp-account">
                          Cuenta <span className="font-normal text-muted-foreground">(opcional)</span>
                        </FieldLabel>
                         <AccountSelect
                           accounts={accounts}
                          id="crp-account"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="notes"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="crp-notes">Notas</FieldLabel>
                        <Textarea
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="crp-notes"
                          placeholder="Opcional"
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
            <Button disabled={isPending} form="create-recurring-payment-form" type="submit">
              {isPending && <Loader2Icon className="size-4 animate-spin" />}
              Guardar pago recurrente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}
