import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"

export default function AccountsLoading() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </section>

      <Card size="sm">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-5 w-28" />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <Skeleton className="h-1.5 w-full rounded-none" />
            <div className="space-y-2 p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
