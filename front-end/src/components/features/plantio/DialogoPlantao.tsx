"use client";

import React from "react";
import { Check, Sprout } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { cropColor, MONTHS_LONG, type Planting } from "@/lib/plantio";
import { CropIcon } from "@/components/features/plantio/CropIcon";
import type { CropProfile } from "@/types/agronomy";
import cropsDatabase from "@/data/crops.json";

const crops = cropsDatabase as CropProfile[];

export type DialogoAlvo =
  | { tipo: "remover"; planting: Planting; mes: number }
  | { tipo: "adicionar"; mes: number }
  | null;

export interface DialogoPlantaoProps {
  alvo: DialogoAlvo;
  onClose: () => void;
  /** Tira um mês do plantio (ou o plantio inteiro, se ficar vazio). */
  onRemover: (plantingId: string, mes: number) => void;
  /** Acrescenta uma cultura a um mês vazio. */
  onAdicionar: (mes: number, cropId: string) => void;
}

/**
 * As duas perguntas do calendário:
 *
 *  - tocar num bloco preenchido → "Queres tirar o Milho de Abril?"
 *  - tocar num bloco vazio → "Que cultura queres semear em Abril?"
 */
export function DialogoPlantao({
  alvo,
  onClose,
  onRemover,
  onAdicionar,
}: DialogoPlantaoProps) {
  if (!alvo) return null;

  if (alvo.tipo === "remover") {
    const crop = crops.find((c) => c.id === alvo.planting.cropId);
    const restantes = alvo.planting.meses.length - 1;

    return (
      <Dialog
        open
        onClose={onClose}
        title={`Tirar ${crop?.name ?? "esta cultura"} de ${MONTHS_LONG[alvo.mes]}?`}
        description={
          restantes > 0
            ? `A cultura fica com ${restantes} ${restantes === 1 ? "mês" : "meses"}. A água e as tarefas actualizam-se logo a seguir.`
            : "Esta é a última vez que esta cultura aparece — a linha toda vai desaparecer do calendário."
        }
      >
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              onRemover(alvo.planting.id, alvo.mes);
              onClose();
            }}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-input bg-danger px-5 text-lg font-bold text-white transition-opacity hover:opacity-90"
          >
            Tirar de {MONTHS_LONG[alvo.mes]}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-14 items-center justify-center rounded-input border border-border bg-surface px-5 text-lg font-bold text-text-secondary transition-colors hover:bg-surface-soft"
          >
            Deixar como está
          </button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Que cultura queres semear em ${MONTHS_LONG[alvo.mes]}?`}
      description="Escolhe uma cultura para este mês. Podes mudar depois — toca no bloco para tirar."
    >
      <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
        {crops.map((crop) => {
          const cor = cropColor(crop.id);

          return (
            <button
              key={crop.id}
              type="button"
              onClick={() => {
                onAdicionar(alvo.mes, crop.id);
                onClose();
              }}
              className="flex items-center gap-3 rounded-input border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-soft"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: cor }}
                aria-hidden
              >
                <CropIcon cropId={crop.id} />
              </span>

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-base font-bold text-text-primary">
                  {crop.name}
                </span>
                <span className="line-clamp-2 text-sm leading-snug text-text-muted">
                  {crop.description}
                </span>
              </span>

              <Check size={18} className="shrink-0 text-text-muted" aria-hidden />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-14 items-center justify-center rounded-input border border-border bg-surface px-5 text-lg font-bold text-text-secondary transition-colors hover:bg-surface-soft"
      >
        Cancelar
      </button>
    </Dialog>
  );
}
