import * as React from "react"

import { Input } from "@/components/ui/input"

type NumberInputProps = Omit<React.ComponentProps<"input">, "type">

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, ...props }, ref) => (
    <Input {...props} ref={ref} type="number" value={value || ""} />
  )
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
