import { z } from "zod"

export const loginSchema = z.object({
  email: z.email("Ingresa un email valido."),
  password: z.string().min(6, "El password debe tener al menos 6 caracteres."),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual."),
    newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirma tu nueva contraseña."),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
export type LoginValues = z.infer<typeof loginSchema>
