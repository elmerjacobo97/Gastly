"use client"

import { ThemeProvider } from "next-themes"

import { Toaster } from "@/components/ui/sonner"

type ProvidersProps = {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      {children}
      <Toaster richColors />
    </ThemeProvider>
  )
}
