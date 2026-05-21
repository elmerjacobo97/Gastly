import { SignUpForm } from "@/features/auth/sign-up-form"

type SignUpPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams

  return <SignUpForm error={params.error} />
}
