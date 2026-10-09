import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="sticky top-14 z-10 border-b bg-background/95 backdrop-blur-sm">
        <div className="px-4 pt-5 md:px-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-1 h-4 w-64 max-w-full" />
        </div>
        <nav className="flex flex-row gap-1 overflow-x-auto px-4 py-2 md:px-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 shrink-0 rounded-md" />
          ))}
        </nav>
      </div>

      <div className="min-w-0 flex-1 p-4 md:p-6">
        <div className="rounded-xl border bg-card p-6">
          <div className="max-w-xl space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      </div>
    </main>
  );
}
