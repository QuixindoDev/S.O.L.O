import React from "react";
import { cn } from "@/lib/cn";

/** Separador horizontal de 1px. */
export function Divider({ className }: { className?: string }) {
  return <hr className={cn("h-px w-full border-0 bg-border", className)} />;
}
