"use client";

import React from "react";
import { Wallet } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { formatarKz } from "@/lib/carbono";
import { descreverMetodo, type MetodoSaque } from "@/lib/saques";

export interface DialogoSacarProps {
  open: boolean;
  /** Quanto está disponível para levantar. */
  disponivelKz: number;
  /** Método registado (ou null). */
  metodo: MetodoSaque | null;
  onClose: () => void;
  /** Confirma o saque. */
  onConfirmar: () => void;
  /** Abre o registo do método de saque. */
  onRegistarMetodo: () => void;
}

/**
 * "Sacar o meu dinheiro" — confirma o levantamento do carbono.
 *
 * Sem método registado, o botão leva ao registo — nunca deixa a
 * Dona Maria num botão que não faz nada.
 */
export function DialogoSacar({
  open,
  disponivelKz,
  metodo,
  onClose,
  onConfirmar,
  onRegistarMetodo,
}: DialogoSacarProps) {
  const semMetodo = !metodo;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Sacar o meu dinheiro"
      description={
        semMetodo
          ? "Antes de sacar, diz-nos para onde queres receber o dinheiro."
          : "O dinheiro vai para o método que registaste."
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 rounded-input bg-primary-soft p-5">
          <span className="text-base font-bold text-text-secondary">
            Available para sacar
          </span>
          <span className="text-3xl font-bold text-primary">
            {formatarKz(disponivelKz)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-base font-bold text-text-primary">
            Método de saque
          </span>
          <span className="text-base text-text-secondary">
            {descreverMetodo(metodo)}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          {semMetodo ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRegistarMetodo();
              }}
              className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-input bg-primary px-5 text-lg font-bold text-white transition-opacity hover:opacity-90"
            >
              <Wallet size={20} aria-hidden />
              Registar método de saque
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirmar}
              disabled={disponivelKz <= 0}
              className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-input bg-primary px-5 text-lg font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Wallet size={20} aria-hidden />
              Sacar {formatarKz(disponivelKz)}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-14 items-center justify-center rounded-input border border-border bg-surface px-5 text-lg font-bold text-text-secondary transition-colors hover:bg-surface-soft"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Dialog>
  );
}
