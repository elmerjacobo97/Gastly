import { type EmailOtpType } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard"
  }

  return next
}

function getRedirectUrl(request: Request, pathname: string) {
  const url = new URL(request.url)
  url.pathname = pathname
  url.search = ""

  return url
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null
  const next = getSafeNextPath(requestUrl.searchParams.get("next"))
  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(getRedirectUrl(request, next))
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (!error) {
      return NextResponse.redirect(getRedirectUrl(request, next))
    }
  }

  const url = getRedirectUrl(request, "/login")
  url.searchParams.set(
    "error",
    "No se pudo confirmar el email. Intenta iniciar sesion nuevamente."
  )

  return NextResponse.redirect(url)
}
