import { Skeleton } from "@/components/ui/skeleton";

export default function BudgetsLoading() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
      </section>

      <Skeleton className="h-40 w-full rounded-xl" />

      <div className="rounded-xl border bg-card">
        <div className="divide-y p-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="size-8 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-1.5 w-full" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
