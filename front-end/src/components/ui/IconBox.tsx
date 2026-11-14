import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type IconBoxSize = "sm" | "md" | "lg";
export type IconBoxTone = "surface" | "soft" | "primary" | "warm" | "warning";

const SIZES: Record<IconBoxSize, { box: string; icon: number }> = {
  sm: { box: "h-10 w-10 rounded-[14px]", icon: 20 },
  md: { box: "h-12 w-12 rounded-input", icon: 24 },
  lg: { box: "h-[52px] w-[52px] rounded-full", icon: 26 },
};

const TONES: Record<IconBoxTone, string> = {
  surface: "bg-surface text-primary",
  soft: "bg-surface-soft text-primary",
  primary: "bg-primary text-white",
  warm: "bg-warm text-warm-text",
  warning: "bg-warning-soft text-warning",
};

/** Quadrado/círculo com ícone. Substitui o costume de "caixa dentro de caixa". */
export function IconBox({
  icon: Icon,
  size = "md",
  tone = "surface",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  icon: LucideIcon;
  size?: IconBoxSize;
  tone?: IconBoxTone;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        SIZES[size].box,
        TONES[tone],
        className,
      )}
      {...props}
    >
      <Icon size={SIZES[size].icon} aria-hidden />
    </div>
  );
}
