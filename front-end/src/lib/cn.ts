import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes Tailwind resolvendo conflitos (última ganha). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
