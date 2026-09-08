"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"

import {
  type ChangePasswordValues,
  type ForgotPasswordValues,
  type LoginValues,
  type ResetPasswordValues,
  type SignUpValues,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signUpSchema,
} from "@/lib/finance/auth/schemas/auth-schemas"
import { createClient } from "@/lib/supabase/server"

type AuthActionResult = {
  error: string
}

function getSafeNextPath(next: string | undefined) {
  if (!next) {
    return "/dashboard"
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard"
  }

  return next
}

export async function signIn(
  values: LoginValues,
  nextPath?: string
): Promise<AuthActionResult | undefined> {
  const parsedValues = loginSchema.safeParse(values)

  if (!parsedValues.success) {
    return { error: parsedValues.error.issues[0]?.message ?? "Datos invalidos." }
  }

  const next = getSafeNextPath(nextPath)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsedValues.data)

  if (error) {
    return { error: error.message }
  }

  redirect(next)
}

export async function signUp(
  values: SignUpValues
): Promise<AuthActionResult | undefined> {
  const parsedValues = signUpSchema.safeParse(values)

  if (!parsedValues.success) {
    return { error: parsedValues.error.issues[0]?.message ?? "Datos invalidos." }
  }

  const headersList = await headers()
  const origin = headersList.get("origin")
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsedValues.data.email,
    password: parsedValues.data.password,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/confirm` : undefined,
      data: {
        full_name: parsedValues.data.fullName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect(`/check-email?email=${encodeURIComponent(parsedValues.data.email)}`)
}

export async function changePassword(
  values: ChangePasswordValues
): Promise<AuthActionResult | undefined> {
  const parsed = changePasswordSchema.safeParse(values)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return { error: "Sesion expirada. Inicia sesion nuevamente." }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  })

  if (signInError) {
    return { error: "Contraseña actual incorrecta." }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  })

  if (updateError) {
    return { error: updateError.message }
  }
}

export async function forgotPassword(
  values: ForgotPasswordValues
): Promise<AuthActionResult | undefined> {
  const parsed = forgotPasswordSchema.safeParse(values)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." }
  }

  const headersList = await headers()
  const origin = headersList.get("origin")
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: origin ? `${origin}/auth/confirm?next=/reset-password` : undefined,
  })

  if (error) {
    return { error: error.message }
  }

  redirect(`/check-email?mode=reset&email=${encodeURIComponent(parsed.data.email)}`)
}

export async function resetPassword(
  values: ResetPasswordValues
): Promise<AuthActionResult | undefined> {
  const parsed = resetPasswordSchema.safeParse(values)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard")
}

export async function signOut() {
  const supabase = await createClient()

  await supabase.auth.signOut()

  redirect("/login")
}
