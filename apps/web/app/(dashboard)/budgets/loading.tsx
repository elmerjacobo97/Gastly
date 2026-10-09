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

      <Skeleton className="h-40 w-full rounded-xl" />

      <TableCardSkeleton rows={4} />
    </main>
  );
}
