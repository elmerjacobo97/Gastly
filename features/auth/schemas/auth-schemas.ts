import { z } from "zod"

export const loginSchema = z.object({
  email: z.email("Ingresa un email valido."),
  password: z.string().min(6, "El password debe tener al menos 6 caracteres."),
})

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Ingresa tu nombre."),
    email: z.email("Ingresa un email valido."),
    password: z.string().min(6, "El password debe tener al menos 6 caracteres."),
    confirmPassword: z
      .string()
      .min(6, "Confirma tu password con al menos 6 caracteres."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Los passwords no coinciden.",
    path: ["confirmPassword"],
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

export const forgotPasswordSchema = z.object({
  email: z.email("Ingresa un email valido."),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirma tu contraseña."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
export type LoginValues = z.infer<typeof loginSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
