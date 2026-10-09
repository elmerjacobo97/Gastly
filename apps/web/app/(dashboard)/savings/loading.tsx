import { SummaryMetricCardsSkeleton } from "@/components/summary-metric-cards-skeleton";
import { TableCardSkeleton } from "@/components/table-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function SavingsLoading() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </section>

      <SummaryMetricCardsSkeleton columns={3} />

      <TableCardSkeleton rows={3} />
    </main>
  );
}
