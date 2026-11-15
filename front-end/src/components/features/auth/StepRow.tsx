import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StepRowProps {
  numero: number;
  title: string;
  description: string;
  /** Ícone à direita — ajuda a memória visual ("abrir mensagens", "teclado"...). */
  icon: LucideIcon;
}

/** Um passo numerado do guia "Como fazer agora, passo a passo" (ecrã 2). */
export function StepRow({ numero, title, description, icon: Icon }: StepRowProps) {
  return (
    <div className="flex w-full shrink-0 flex-row items-center gap-4.5 rounded-[16px] bg-surface-soft p-[16px_18px]">
      <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-primary">
        <span className="text-[24px] font-bold text-white">{numero}</span>
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-[20px] font-bold text-text-primary">{title}</span>
        <span className="text-[17px]/[25px] text-text-secondary">{description}</span>
      </span>

      <Icon size={26} className="shrink-0 text-text-muted" aria-hidden="true" />
    </div>
  );
}
