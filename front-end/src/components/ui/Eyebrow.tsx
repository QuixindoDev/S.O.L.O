import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface EyebrowProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  children: React.ReactNode;
}

/** Etiqueta pequena acima de um título — categoria da secção. */
export function Eyebrow({ icon: Icon, children, className, ...props }: EyebrowProps) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-bold text-primary",
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={16} aria-hidden />}
      {children}
    </div>
  );
}
