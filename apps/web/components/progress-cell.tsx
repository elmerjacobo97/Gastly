import { type ReactNode } from "react";

type ProgressCellProps = {
  percent: number;
  color?: string;
  children?: ReactNode;
};

export function ProgressCell({ percent, color, children }: ProgressCellProps) {
  const width = Math.min(Math.max(percent, 0), 100);

  return (
    <div className="flex min-w-32 flex-col gap-1">
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/70"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      {children && (
        <span className="text-xs tabular-nums text-muted-foreground">
          {children}
        </span>
      )}
    </div>
  );
}
