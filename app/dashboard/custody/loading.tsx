import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"

export default function CustodyLoading() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-8 w-36" />
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card size="sm" key={i}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-2 h-5 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card">
            <div className="flex items-start justify-between gap-3 border-b p-5 pb-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="size-8 rounded-md" />
            </div>
            <div className="flex flex-col gap-2 p-5">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-6">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="p-4">
          <Skeleton className="mb-3 h-9 w-64" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-12 w-full" />
          ))}
        </div>
      </div>
    </main>
  )
}
