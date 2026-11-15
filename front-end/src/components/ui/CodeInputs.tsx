"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CodeInputsProps {
  /** Número de quadradinhos. O design usa 6 (código de SMS). */
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  /** Erro shown below the boxes. */
  error?: string;
  label?: string;
}

const BOX = "w-[70px] h-[84px] shrink-0 flex items-center justify-center rounded-input border-2 border-border bg-surface-soft text-[30px] font-bold text-text-primary";

/**
 * Os 6 quadradinhos do código de segurança (ecrã 3).
 *
 * Cada quadradinho é um campo real: o teclado numérico do telemóvel abre
 * sozinho (`inputMode="numeric"`) e o foco avança sozinho para o seguinte.
 */
export function CodeInputs({
  length = 6,
  value = "",
  onChange,
  error,
  label = "Digite os 6 números do SMS:",
}: CodeInputsProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [internal, setInternal] = useState(value);
  const code = value || internal;

  const update = (next: string) => {
    setInternal(next);
    onChange?.(next);
  };

  const setAt = (index: number, char: string) => {
    const chars = code.padEnd(length, " ").split("");
    chars[index] = char || " ";
    update(chars.join("").trimEnd());
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      setAt(index, "");
      return;
    }
    // Cola de vários dígitos: distribui pelos quadradinhos seguintes.
    const chars = code.padEnd(length, " ").split("");
    digits.split("").forEach((digit, offset) => {
      if (index + offset < length) chars[index + offset] = digit;
    });
    update(chars.join("").trimEnd());
    const next = Math.min(length - 1, index + digits.length);
    refs.current[next]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
      setAt(index - 1, "");
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <span className="text-[22px] font-bold text-text-primary">{label}</span>

      <div className="flex w-full flex-row items-start justify-center gap-2.5">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            value={code[index] ?? ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={length}
            aria-label={`Número ${index + 1} de ${length}`}
            className={cn(
              BOX,
              "text-center outline-none transition-colors",
              "focus-visible:border-primary focus-visible:outline-3 focus-visible:outline-primary focus-visible:outline-offset-2",
              error && "border-danger"
            )}
          />
        ))}
      </div>

      {error ? (
        <p className="w-full text-center text-[17px] text-danger">{error}</p>
      ) : (
        <p className="w-full text-center text-[17px] text-text-muted">
          Toque no primeiro quadradinho para começar. O teclado numérico abre
          sozinho no celular.
        </p>
      )}
    </div>
  );
}
