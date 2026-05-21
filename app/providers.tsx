"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { useState } from "react"

import { Toaster } from "@/components/ui/sonner"

type ProvidersProps = {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      })
  )

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      <Toaster richColors />
    </ThemeProvider>
  )
}
