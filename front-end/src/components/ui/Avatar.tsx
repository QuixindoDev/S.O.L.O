import React from "react";
import { cn } from "@/lib/cn";

export interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  tone?: "warm" | "primary";
  className?: string;
}

const SIZES = {
  sm: { box: "h-10 w-10", text: "text-base" },
  md: { box: "h-11 w-11", text: "text-lg" },
  lg: { box: "h-14 w-14", text: "text-2xl" },
};

const TONES = {
  warm: "bg-warm text-warm-text",
  primary: "bg-primary text-white",
};

/** Círculo com iniciais — identifica a pessoa sem foto. */
export function Avatar({
  initials,
  size = "md",
  tone = "warm",
  className,
}: AvatarProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        SIZES[size].box,
        SIZES[size].text,
        TONES[tone],
        className,
      )}
    >
      {initials}
    </div>
  );
}
