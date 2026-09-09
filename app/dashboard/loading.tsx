import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card size="sm" key={i}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-5 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-6">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="divide-y p-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-3">
              <Skeleton className="size-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border bg-card p-6">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="mt-4 h-52 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="mt-4 h-52 w-full rounded-lg" />
        </div>
      </div>
    </main>
  )
}
