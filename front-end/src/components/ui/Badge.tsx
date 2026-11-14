import React from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "primary"
  | "soft"
  | "warning"
  | "danger"
  | "neutral"
  | "onPrimary";

const TONES: Record<BadgeTone, string> = {
  primary: "bg-primary-soft text-primary",
  soft: "bg-surface text-text-secondary",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-surface-soft text-text-muted",
  onPrimary: "bg-primary text-white",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "sm" | "md";
}

/** Etiqueta de estado. `onPrimary` = texto branco sobre verde. */
export function Badge({
  tone = "primary",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full font-bold",
        size === "sm"
          ? "px-2.5 py-1 text-xs sm:text-sm"
          : "px-3 py-1.5 text-sm sm:px-3.5 sm:text-base",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
