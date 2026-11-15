import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  /** Mensagem de erro — substitui o texto de ajuda. */
  error?: string;
}

/**
 * Campo de texto com 64px de altura (regra do projecto: toque fácil).
 */
export function Input({ icon: Icon, error, className, ...props }: InputProps) {
  return (
    <div className="flex w-full flex-col items-start">
      <div
        className={cn(
          "flex w-full items-center gap-3 rounded-input border bg-surface px-[18px]",
          "h-16 transition-colors focus-within:border-primary",
          error ? "border-danger" : "border-border",
          className
        )}
      >
        {Icon && (
          <Icon size={22} className="shrink-0 text-text-muted" aria-hidden="true" />
        )}
        <input
          className={cn(
            "w-full bg-transparent text-[20px] text-text-primary outline-none",
            "placeholder:text-text-muted"
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />
      </div>
      {error && <p className="mt-2 text-[17px] text-danger">{error}</p>}
    </div>
  );
}
