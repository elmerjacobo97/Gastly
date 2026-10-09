import { type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

const TONE_CLASSES = {
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive",
  muted: "",
} as const;

type StatusBadgeProps = {
  tone: keyof typeof TONE_CLASSES;
  children: ReactNode;
};

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <Badge variant="secondary" className={TONE_CLASSES[tone]}>
      {children}
    </Badge>
  );
}
