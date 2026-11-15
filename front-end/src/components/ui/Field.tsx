import { AlertCircle } from "lucide-react";
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  icon?: LucideIconType;
  required?: boolean;
  /** Erro **deste** campo. Aparece aqui mesmo, logo abaixo do campo. */
  error?: string;
  children: ReactNode;
}

type LucideIconType = React.ComponentType<{ size?: number; className?: string }>;

/**
 * Rótulo + controlo + texto de ajuda.
 *
 * O texto de ajuda explica sempre o *porquê* do campo, em linguagem simples.
 *
 * Quando há `error`, o texto de ajuda é substituído pela mensagem de erro:
 * o produtor vê o problema **no sítio onde o Cometiu**, sem procurar.
 */
export function Field({
  id,
  label,
  hint,
  icon: Icon,
  required,
  error,
  children,
}: FieldProps) {
  // Liga o input ao texto de erro para os leitores de ecrã.
  const erroId = `${id}-erro`;

  const controlo = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? erroId : undefined,
      })
    : children;

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <label
        htmlFor={id}
        className="flex items-center gap-2.5 text-[20px] font-bold text-text-primary"
      >
        {Icon && <Icon size={22} className="text-text-secondary" aria-hidden="true" />}
        {label}
        {required && <span className="text-danger">*</span>}
      </label>

      {controlo}

      {error ? (
        <p
          id={erroId}
          role="alert"
          className="flex w-full items-start gap-2 text-[17px] font-semibold text-danger"
        >
          <AlertCircle size={20} className="mt-[3px] shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : (
        hint && <p className="w-full text-[17px] text-text-muted">{hint}</p>
      )}
    </div>
  );
}
