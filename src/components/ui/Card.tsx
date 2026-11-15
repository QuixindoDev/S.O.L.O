import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  /** `default` = cartão branco com borda (ecrãs 1, 1B, 2 e 3). */
  variant?: "default" | "soft";
  /** Espaçamento interno. `md` = 40px (ecrã 2 e 3), `lg` = 48px (ecrãs 1 e 1B). */
  padding?: "md" | "lg";
  className?: string;
  children: ReactNode;
}

const PADDINGS = {
  md: "p-[40px_40px_36px_40px]",
  lg: "p-[48px_48px_40px_48px]",
} as const;

export function Card({ variant = "default", padding = "md", className, children }: CardProps) {
  return (
    <section
      className={cn(
        "flex w-full shrink-0 flex-col items-start rounded-card",
        variant === "default"
          ? "border border-border bg-surface"
          : "bg-surface-soft rounded-[16px]",
        PADDINGS[padding],
        className
      )}
    >
      {children}
    </section>
  );
}
