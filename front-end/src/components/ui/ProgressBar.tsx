import React from "react";
import { cn } from "@/lib/cn";

export interface ProgressBarProps {
  label: string;
  /** 0-100 */
  value: number;
  /** Texto mostrado à direita. Por defecto o valor em %. */
  displayValue?: string;
  className?: string;
}

/** Barra de pontuação com rótulo e valor — usada no simulador de rotação. */
export function ProgressBar({
  label,
  value,
  displayValue,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-base font-bold text-text-primary sm:text-lg">
          {label}
        </span>
        <span className="shrink-0 text-base font-bold text-primary tabular-nums sm:text-lg">
          {displayValue ?? `${clamped}%`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-3.5 w-full overflow-hidden rounded-full bg-surface-soft"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
