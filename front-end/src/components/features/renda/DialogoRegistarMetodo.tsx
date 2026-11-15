"use client";

import React, { useState } from "react";
import { Building2, Smartphone } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { saveMetodoSaque, type MetodoSaque } from "@/lib/saques";

export interface DialogoRegistarMetodoProps {
  open: boolean;
  onClose: () => void;
  /** Avisa o ecrã que o método ficou guardado. */
  onGuardado?: (metodo: MetodoSaque) => void;
}

/**
 * "Registar método de saque" — onde o dinheiro vai quando a Dona
 * Maria levanta o carbono da sua terra.
 */
export function DialogoRegistarMetodo({
  open,
  onClose,
  onGuardado,
}: DialogoRegistarMetodoProps) {
  const [tipo, setTipo] = useState<"telemovel" | "banco">("telemovel");
  const [referencia, setReferencia] = useState("");
  const [nome, setNome] = useState("");

  function handleGuardar() {
    const limpo = referencia.trim();
    if (!limpo) return;

    const metodo: MetodoSaque = {
      tipo,
      referencia: limpo,
      nome: nome.trim() || undefined,
    };

    saveMetodoSaque(metodo);
    onGuardado?.(metodo);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Registar método de saque"
      description="Escolhe onde queres receber o dinheiro do carbono da tua terra."
    >
      <div className="flex flex-col gap-4">
        {/* Tipo de método */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(
            [
              {
                valor: "telemovel" as const,
                nome: "Carteira de telemóvel",
                exemplo: "M-Pesa ou Unitel Money",
                icone: Smartphone,
              },
              {
                valor: "banco" as const,
                nome: "Conta bancária",
                exemplo: "BI, BAI, BFA…",
                icone: Building2,
              },
            ]
          ).map((opcao) => {
            const Icon = opcao.icone;
            const ativa = tipo === opcao.valor;

            return (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => setTipo(opcao.valor)}
                aria-pressed={ativa}
                className={`flex flex-col gap-1 rounded-input border p-4 text-left transition-colors ${
                  ativa
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-surface hover:bg-surface-soft"
                }`}
              >
                <span className="flex items-center gap-2 text-base font-bold text-text-primary">
                  <Icon size={18} className="text-primary" aria-hidden />
                  {opcao.nome}
                </span>
                <span className="text-sm text-text-muted">{opcao.exemplo}</span>
              </button>
            );
          })}
        </div>

        {/* Referência */}
        <label className="flex flex-col gap-1.5">
          <span className="text-base font-bold text-text-primary">
            {tipo === "telemovel" ? "Número da carteira" : "IBAN ou nº da conta"}
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={referencia}
            onChange={(event) => setReferencia(event.target.value)}
            placeholder={tipo === "telemovel" ? "923 456 789" : "AO06 0000 0000 0000 0000 0"}
            className="h-14 w-full rounded-input border border-border bg-surface px-4 text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus-visible:border-primary"
          />
        </label>

        {/* Nome */}
        <label className="flex flex-col gap-1.5">
          <span className="text-base font-bold text-text-primary">
            Nome (opcional)
          </span>
          <input
            type="text"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Ex.: a carteira da minha mana"
            className="h-14 w-full rounded-input border border-border bg-surface px-4 text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus-visible:border-primary"
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={handleGuardar}
            disabled={!referencia.trim()}
            className="inline-flex h-14 flex-1 items-center justify-center rounded-input bg-primary px-5 text-lg font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Guardar método
          </button>

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
