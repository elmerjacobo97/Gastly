import { Skeleton } from "@/components/ui/skeleton";

type TableCardSkeletonProps = {
  rows?: number;
};

export function TableCardSkeleton({ rows = 5 }: TableCardSkeletonProps) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="space-y-1.5 border-b p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-full sm:w-64" />
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="rounded-md border">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
            >
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="hidden h-4 w-20 md:block" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
