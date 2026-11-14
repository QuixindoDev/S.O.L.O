import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Estado vazio — explica o que falta em vez de mostrar um ecrã em branco. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft">
        <Icon size={28} className="text-primary" aria-hidden />
      </div>
      <p className="text-2xl font-bold text-text-primary">{title}</p>
      {description && (
        <p className="max-w-md text-lg text-text-secondary">{description}</p>
      )}
      {action}
    </div>
  );
}
