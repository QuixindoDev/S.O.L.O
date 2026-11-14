import React from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/** Campo de texto. Altura 64px — alvo de toque confortável. */
export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-16 w-full min-w-0 rounded-input border bg-surface px-4 text-lg text-text-primary sm:px-[18px] sm:text-xl",
        "placeholder:text-text-muted",
        "focus:outline-none focus-visible:outline-3 focus-visible:outline-primary",
        invalid ? "border-danger" : "border-border",
        className,
      )}
      {...props}
    />
  );
}
