import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"

export default function MonthlyPlanLoading() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-36" />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card size="sm" key={i}>
            <CardHeader>
              <Skeleton className="h-3 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-32" />
              <Skeleton className="mt-1 h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-8 w-36" />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
      </div>
    </main>
  )
}
