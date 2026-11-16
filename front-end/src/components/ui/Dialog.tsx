"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Janela de diálogo — o que abre por cima do ecrã.
 *
 * Fecha com Escape ou tocando fora, e o foco vai para o primeiro
 * botão: quem usa teclado ou leitor de ecrã não fica perdido.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // O `onClose` muda de identidade a cada render do componente pai.
  // Guardamo-lo numa ref para que o efeito abaixo (que mexe no foco)
  // só corra quando o diálogo abre — senão, a cada tecla escrita num
  // campo, o foco saltava para o botão de fechar e o cursor sumia.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Só pomos o foco no primeiro campo quando o diálogo acaba de
    // abrir — nunca quando a pessoa já está a escrever.
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) {
      const first = panel.querySelector<HTMLElement>(
        "input, textarea, select, button, a",
      );
      first?.focus();
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "flex max-h-[85vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-card bg-surface p-6 shadow-[0_24px_60px_-20px_rgba(31,27,23,0.5)]",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-text-primary">{title}</h2>
            {description && (
              <p className="text-base leading-snug text-text-secondary">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-soft"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}
