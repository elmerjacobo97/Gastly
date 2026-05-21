"use client"

import { EyeIcon, EyeOffIcon, LockKeyholeIcon } from "lucide-react"
import { useState } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

type PasswordInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "autoComplete" | "type"
> & {
  autoComplete: "current-password" | "new-password"
}

export function PasswordInput({
  autoComplete,
  id = "password",
  name = "password",
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <InputGroup>
      <InputGroupInput
        autoComplete={autoComplete}
        id={id}
        minLength={6}
        name={name}
        required
        type={isVisible ? "text" : "password"}
        {...props}
      />
      <InputGroupAddon align="inline-start">
        <LockKeyholeIcon />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          aria-label={isVisible ? "Ocultar password" : "Mostrar password"}
          onClick={() => setIsVisible((current) => !current)}
          size="icon-xs"
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
