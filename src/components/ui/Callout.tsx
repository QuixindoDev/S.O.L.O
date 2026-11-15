import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface CalloutProps {
  icon: LucideIcon;
  /**
   * `note`   — aviso simples: ícone + uma frase (ecrãs 1 e 1B).
   * `message`— boa notícia: ícone em círculo + título + explicação (ecrã 2).
   * `help`   — ajuda humana: ícone em círculo + título + explicação + acção (ecrã 3).
   */
  variant?: "note" | "message" | "help";
  title?: string;
  description?: string;
  /** Acção dentro do bloco (ex. botão "Falar com a Agrónoma"). */
  action?: ReactNode;
  className?: string;
}

export function Callout({
  icon: Icon,
  variant = "message",
  title,
  description,
  action,
  className,
}: CalloutProps) {
  if (variant === "note") {
    return (
      <div
        className={cn(
          "flex w-full shrink-0 flex-row items-center gap-3 rounded-[14px] bg-primary-soft p-[16px_18px]",
          className
        )}
      >
        <Icon size={24} className="shrink-0 text-primary" aria-hidden="true" />
        <span className="flex-1 text-[17px] text-text-secondary">{description}</span>
      </div>
    );
  }

  const isHelp = variant === "help";

  return (
    <div
      className={cn(
        "flex w-full shrink-0 rounded-[16px] bg-primary-soft",
        isHelp
          ? "flex-col items-start gap-3.5 p-[20px_22px]"
          : "flex-row items-center gap-3.5 p-[18px_20px]",
        className
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface">
        <Icon size={24} className="text-primary" aria-hidden="true" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        {title && (
          <span className="text-[19px] font-bold text-text-primary">{title}</span>
        )}
        {description && (
          <span className="text-[17px] text-text-secondary">{description}</span>
        )}
      </div>

      {action}
    </div>
  );
}
