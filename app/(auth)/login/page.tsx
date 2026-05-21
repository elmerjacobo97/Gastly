import { LoginForm } from "@/features/auth/login-form"

type LoginPageProps = {
  searchParams: Promise<{
    error?: string
    next?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return <LoginForm error={params.error} next={params.next} />
}
