import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  /**
   * Marca o campo como inválido (borda vermelha + `aria-invalid`).
   * A **mensagem** de erro é desenhada pelo `Field`, logo abaixo do campo —
   * assim o texto só aparece uma vez.
   */
  error?: string;
}

/**
 * Campo de texto com 64px de altura (regra do projecto: toque fácil).
 *
 * Usa `forwardRef` para que a página possa levar o foco do teclado até ao
 * primeiro campo com erro.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ icon: Icon, error, className, ...props }, ref) {
    return (
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
          ref={ref}
          className={cn(
            "w-full bg-transparent text-[20px] text-text-primary outline-none",
            "placeholder:text-text-muted"
          )}
          {...props}
        />
      </div>
    );
  }
);
