import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  icon?: LucideIcon;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

/**
 * Rótulo + controlo + texto de ajuda.
 * O texto de ajuda explica sempre o *porquê* do campo, em linguagem simples.
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
      {children}
      {!error && hint && (
        <p className="w-full text-[17px] text-text-muted">{hint}</p>
      )}
    </div>
  );
}
