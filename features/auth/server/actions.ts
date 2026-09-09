"use server"

import { redirect } from "next/navigation"

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
} from "@/features/auth/schemas/auth-schemas"
import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/seo"

type AuthActionResult = {
  error: string
}

function getAuthOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL
}

function redirectToSafePath(next: string | undefined): never {
  switch (next) {
    case "/dashboard/accounts":
      redirect("/dashboard/accounts")
    case "/dashboard/budget":
      redirect("/dashboard/budget")
    case "/dashboard/categories":
      redirect("/dashboard/categories")
    case "/dashboard/custody":
      redirect("/dashboard/custody")
    case "/dashboard/installments":
      redirect("/dashboard/installments")
    case "/dashboard/loans":
      redirect("/dashboard/loans")
    case "/dashboard/monthly-plan":
      redirect("/dashboard/monthly-plan")
    case "/dashboard/recurring-payments":
      redirect("/dashboard/recurring-payments")
    case "/dashboard/reports":
      redirect("/dashboard/reports")
    case "/dashboard/savings":
      redirect("/dashboard/savings")
    case "/dashboard/settings":
      redirect("/dashboard/settings")
    case "/dashboard/transactions":
      redirect("/dashboard/transactions")
    default:
      redirect("/dashboard")
  }
}

export async function signIn(
  values: LoginValues,
  nextPath?: string
): Promise<AuthActionResult | undefined> {
  const parsedValues = loginSchema.safeParse(values)

  if (!parsedValues.success) {
    return { error: parsedValues.error.issues[0]?.message ?? "Datos invalidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsedValues.data)

  if (error) {
    return { error: error.message }
  }

  redirectToSafePath(nextPath)
}

export async function signUp(
  values: SignUpValues
): Promise<AuthActionResult | undefined> {
  const parsedValues = signUpSchema.safeParse(values)

  if (!parsedValues.success) {
    return { error: parsedValues.error.issues[0]?.message ?? "Datos invalidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsedValues.data.email,
    password: parsedValues.data.password,
    options: {
      emailRedirectTo: `${getAuthOrigin()}/auth/confirm`,
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

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAuthOrigin()}/auth/confirm?next=/reset-password`,
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
