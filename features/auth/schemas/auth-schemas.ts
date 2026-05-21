import { z } from "zod/v3"

export const loginSchema = z.object({
  email: z.string().email("Ingresa un email valido."),
  password: z.string().min(6, "El password debe tener al menos 6 caracteres."),
})

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Ingresa tu nombre."),
    email: z.string().email("Ingresa un email valido."),
    password: z.string().min(6, "El password debe tener al menos 6 caracteres."),
    confirmPassword: z
      .string()
      .min(6, "Confirma tu password con al menos 6 caracteres."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Los passwords no coinciden.",
    path: ["confirmPassword"],
  })

export type LoginValues = z.infer<typeof loginSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
