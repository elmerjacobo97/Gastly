"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod/v3"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NumberInput } from "@/components/ui/number-input"
import { getUserSettings, upsertUserSettings } from "@/features/settings/lib/user-settings-api"

const schema = z.object({
  savingsPercentage: z
    .number({ invalid_type_error: "Ingresa un porcentaje" })
    .min(0, "Mínimo 0%")
    .max(100, "Máximo 100%"),
})

type FormValues = z.infer<typeof schema>

export function FinancesSection() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: ["user-settings"],
    queryFn: getUserSettings,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { savingsPercentage: 20 },
  })

  useEffect(() => {
    if (settingsQuery.data) {
      form.reset({ savingsPercentage: settingsQuery.data.savingsPercentage })
    }
  }, [settingsQuery.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      upsertUserSettings({ savingsPercentage: values.savingsPercentage }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-settings"] })
      toast.success("Configuración guardada")
    },
    onError: (error) => {
      toast.error("No se pudo guardar", { description: error.message })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ahorro mensual</CardTitle>
        <CardDescription>
          Porcentaje de tus ingresos que separas automáticamente como ahorro obligatorio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          className="flex items-end gap-4"
        >
          <FieldGroup className="flex-1 max-w-xs">
            <Controller
              control={form.control}
              name="savingsPercentage"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="savings-pct">Porcentaje de ahorro (%)</FieldLabel>
                  <NumberInput
                    {...field}
                    id="savings-pct"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="20"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
