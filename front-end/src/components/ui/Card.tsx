import React from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "default" | "soft" | "outline";

const VARIANTS: Record<CardVariant, string> = {
  default: "bg-surface border border-border",
  soft: "bg-surface-soft border border-transparent",
  outline: "bg-transparent border border-border",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
}

const PADDINGS = {
  none: "p-0",
  sm: "p-4",
  md: "p-5",
  lg: "p-7",
};

/** Contentor base de ecrã. Nunca aninhar um Card dentro de outro sem razão funcional. */
export function Card({
  variant = "default",
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card",
        VARIANTS[variant],
        PADDINGS[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
