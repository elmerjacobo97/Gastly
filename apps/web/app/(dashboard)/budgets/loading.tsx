import { TableCardSkeleton } from "@/components/table-card-skeleton";
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

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="size-8" />
          </div>
        </div>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-40" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>

      <TableCardSkeleton rows={4} />
    </main>
  );
}
