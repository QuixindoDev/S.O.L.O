import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusMessageProps {
  /**
   * `true`  — a operação foi bem sucedida (verde da marca).
   * `false` — a operação falhou (vermelho de erro).
   */
  success: boolean;
  /** Texto que o produtor lê. Ex.: "A sua conta foi criada com sucesso." */
  message: string;
  /** Título curto acima da mensagem. Por omissão muda conforme o estado. */
  title?: string;
  className?: string;
}

/**
 * Faixa de retorno para formulários — aparece **abaixo dos campos**,
 * depois de o produtor carregar no botão.
 *
 * Regras do projecto:
 *  - Verde da marca para sucesso, vermelho `danger` para erro (contraste alto
 *    para leitura ao sol).
 *  - Ícone dentro de um círculo preenchido: identifica o estado mesmo sem
 *    ler a cor.
 *  - Anima uma vez, de baixo para cima, para o olho ir lá parar.
 */
export function StatusMessage({
  success,
  message,
  title,
  className,
}: StatusMessageProps) {
  const Icon = success ? CheckCircle2 : AlertTriangle;

  return (
    <div
      role={success ? "status" : "alert"}
      aria-live={success ? "polite" : "assertive"}
      className={cn(
        "flex w-full shrink-0 items-start gap-3.5 rounded-[16px] p-[16px_18px]",
        "animate-[message-in_320ms_ease-out_both]",
        success
          ? "border border-success/25 bg-success-soft"
          : "border border-danger/30 bg-danger-soft",
        className
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-white",
          success ? "bg-success" : "bg-danger"
        )}
      >
        <Icon size={24} aria-hidden="true" strokeWidth={2.5} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span
          className={cn(
            "text-[17px] font-bold",
            success ? "text-success" : "text-danger"
          )}
        >
          {title ?? (success ? "Tudo certo!" : "Não foi possível")}
        </span>
        <span className="text-[17px] text-text-secondary">{message}</span>
      </div>
    </div>
  );
}
