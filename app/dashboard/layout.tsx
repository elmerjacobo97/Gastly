import { redirect } from "next/navigation"

import { AppSidebar } from "@/features/dashboard/components/app-sidebar"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/server"

type DashboardLayoutProps = {
  children: React.ReactNode
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userName = user.user_metadata?.full_name as string | undefined

  return (
    <SidebarProvider>
      <AppSidebar userEmail={user.email} userName={userName} />
      <SidebarInset>
        <PageHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
