import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  size?: "sm" | "md" | "lg";
  tone?: "surface" | "soft" | "primary" | "warm";
}

const SIZES = {
  sm: { box: "h-11 w-11", icon: 20 },
  md: { box: "h-14 w-14", icon: 24 },
  lg: { box: "h-16 w-16", icon: 28 },
};

const TONES = {
  surface: "bg-surface text-text-primary border border-border",
  soft: "bg-surface-soft text-primary",
  primary: "bg-primary text-white",
  warm: "bg-warm text-warm-text",
};

/** Botão só com ícone. `label` é obrigatório — nunca há ícone sem rótulo. */
export function IconButton({
  icon: Icon,
  label,
  size = "md",
  tone = "surface",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        SIZES[size].box,
        TONES[tone],
        className,
      )}
      {...props}
    >
      <Icon size={SIZES[size].icon} aria-hidden />
    </button>
  );
}
