import { type EmailOtpType } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

const CONFIRM_ERROR_REDIRECT =
  "/login?error=No%20se%20pudo%20confirmar%20el%20email.%20Intenta%20iniciar%20sesion%20nuevamente."

function redirectToSafePath(next: string | null): never {
  switch (next) {
    case "/reset-password":
      redirect("/reset-password")
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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null
  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      redirectToSafePath(requestUrl.searchParams.get("next"))
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (!error) {
      redirectToSafePath(requestUrl.searchParams.get("next"))
    }
  }

  redirect(CONFIRM_ERROR_REDIRECT)
}
