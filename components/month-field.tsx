"use client"

import { startOfMonth } from "date-fns"
import { type FieldError as FormFieldError } from "react-hook-form"

import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
].map((label, value) => ({ label, value }))

function getYearOptions() {
  const year = new Date().getFullYear()
  return [year - 1, year, year + 1]
}

type MonthFieldProps = {
  value: Date
  invalid: boolean
  error?: FormFieldError
  onChange: (value: Date) => void
}

export function MonthField({ value, invalid, error, onChange }: MonthFieldProps) {
  return (
    <Field data-invalid={invalid}>
      <FieldLabel>Mes</FieldLabel>
      <div className="flex gap-2">
        <NativeSelect
          value={value.getMonth()}
          onChange={(event) => {
            const date = new Date(value)
            date.setMonth(Number(event.target.value))
            onChange(startOfMonth(date))
          }}
          className="flex-1"
        >
          {MONTHS.map((month) => (
            <NativeSelectOption key={month.value} value={month.value}>
              {month.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          value={value.getFullYear()}
          onChange={(event) => {
            const date = new Date(value)
            date.setFullYear(Number(event.target.value))
            onChange(startOfMonth(date))
          }}
          className="w-28"
        >
          {getYearOptions().map((year) => (
            <NativeSelectOption key={year} value={year}>
              {year}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {invalid && <FieldError errors={error ? [error] : []} />}
    </Field>
  )
}
