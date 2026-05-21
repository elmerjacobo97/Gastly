"use server"

import { redirect } from "next/navigation"

import {
  type LoginValues,
  type SignUpValues,
  loginSchema,
  signUpSchema,
} from "@/features/auth/schemas"
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

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsedValues.data.email,
    password: parsedValues.data.password,
    options: {
      data: {
        full_name: parsedValues.data.fullName,
      },
    },
  })

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
