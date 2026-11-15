import { Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PhoneNoticeProps {
  /** Número mostrado. Por segurança, mascarado no ecrã do código. */
  numero: string;
  label?: string;
  /** Acção à direita (ex. "Mudar número" no ecrã 3). */
  action?: ReactNode;
  className?: string;
}

/**
 * Faixa que diz para onde foi enviada a mensagem de segurança.
 * Aparece no ecrã 2 (SMS enviado) e no ecrã 3 (código).
 */
export function PhoneNotice({
  numero,
  label = "Mensagem enviada para",
  action,
  className,
}: PhoneNoticeProps) {
  return (
    <div
      className={cn(
        "flex w-full shrink-0 flex-row items-center gap-3.5 rounded-[16px] bg-surface-soft p-4",
        className
      )}
    >
      <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-surface">
        <Smartphone size={26} className="text-text-secondary" aria-hidden="true" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="text-[17px] text-text-muted">{label}</span>
        <span className="text-[24px] font-bold text-text-primary">{numero}</span>
      </div>

      {action}
    </div>
  );
}
