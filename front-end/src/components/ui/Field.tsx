import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Input } from "./Input";

export interface FieldProps {
  label: string;
  icon?: LucideIcon;
  placeholder?: string;
  helper?: string;
  type?: React.HTMLInputTypeAttribute;
  value?: string;
  defaultValue?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  autoComplete?: string;
}

/**
 * Campo de formulário: rótulo + ícone + caixa + texto de ajuda.
 * O texto de ajuda é sempre em tom suave e nunca em negrito —
 * é a instrução, não o título.
 */
export function Field({
  label,
  icon: Icon,
  placeholder,
  helper,
  type = "text",
  value,
  defaultValue,
  onChange,
  required,
  autoComplete,
}: FieldProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <label className="flex items-center gap-2.5 text-lg font-bold text-text-primary sm:text-xl">
        {Icon && (
          <Icon size={22} className="shrink-0 text-primary" aria-hidden />
        )}
        {label}
      </label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
      />
      {helper && (
        <span className="text-base leading-snug text-text-muted sm:text-[17px]">
          {helper}
        </span>
      )}
    </div>
  );
}
