import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const columnClasses = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

export function SummaryMetricCardsSkeleton({
  columns,
}: {
  columns: keyof typeof columnClasses;
}) {
  return (
    <div className={cn("grid gap-3", columnClasses[columns])}>
      {Array.from({ length: columns }).map((_, i) => (
        <Card className="min-w-0" size="sm" key={i}>
          <CardHeader className="gap-1 pb-0">
            <Skeleton className="h-3 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-36 max-w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
