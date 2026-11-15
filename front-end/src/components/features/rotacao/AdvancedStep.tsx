"use client";

import React from "react";
import { ArrowRight, Droplets, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CycleCard } from "@/components/features/rotacao/CycleCard";
import { cn } from "@/lib/cn";
import type { RotationSimulation } from "@/hooks/useSimulator";
import type { CropProfile, RotationSequenceSelection } from "@/types/agronomy";

export interface AdvancedStepProps {
  /** Cultura escolhida em cada ciclo. */
  selection: RotationSequenceSelection;
  onChange: (index: number, cropId: string) => void;
  crops: CropProfile[];
  result: RotationSimulation;
  /** Volta às combinações prontas (Passo 2). */
  onBackToPresets: () => void;
  /** Confirma e vai para o diagnóstico. */
  onConfirm: () => void;
}

/**
 * Plano 4 — "Montar do meu jeito".
 *
 * Para quem já sabe o que quer plantar. Mesma água, mesma leitura:
 * em cada ciclo vê-se quanto a planta precisa e quanto a chuva dá.
 */
export function AdvancedStep({
  selection,
  onChange,
  crops,
  result,
  onBackToPresets,
  onConfirm,
}: AdvancedStepProps) {
  const selected = [
    selection.cycle1CropId,
    selection.cycle2CropId,
    selection.cycle3CropId,
  ];

  const sobra = result.balance.totalBalanceMm;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4 rounded-input bg-surface-soft p-5">
        <Info size={22} className="shrink-0 text-text-secondary" aria-hidden />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-base font-bold text-text-primary">
            Escolheste o Plano 4 — modo avançado. Vê como fica a água antes de
            confirmar.
          </span>
          <span className="text-sm text-text-secondary">
            Se preferes, volta às 3 combinações prontas que a NASA testou.
          </span>
        </div>

        <button
          type="button"
          onClick={onBackToPresets}
          className="inline-flex h-11 shrink-0 items-center rounded-full border border-border bg-surface px-4 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-soft"
        >
          Ver combinações prontas
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {selected.map((cropId, index) => {
          const cycle = result.balance.cycles[index];

          return (
            <CycleCard
              key={index}
              index={index}
              cropId={cropId}
              crops={crops}
              onChange={(next) => onChange(index, next)}
              demandMm={cycle?.demandMm}
              rainMm={cycle?.rainMm}
            />
          );
        })}
      </div>

      <Card padding="lg" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Droplets size={24} className="shrink-0 text-primary" aria-hidden />

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-lg font-bold text-text-primary">
              Resumo da água da tua rotação
            </span>
            <span className="text-sm text-text-muted">
              Precisas de {result.balance.totalDemandMm} mm no total · A chuva
              que fica na terra dá {result.balance.totalRainMm} mm
            </span>
          </div>

          <span
            className={cn(
              "inline-flex items-center rounded-full px-3.5 py-2 text-sm font-bold",
              sobra >= 0
                ? "bg-primary text-surface"
                : "bg-warning-soft text-warning",
            )}
          >
            {sobra >= 0 ? `Sobra ${sobra} mm` : `Faltam ${Math.abs(sobra)} mm`}
          </span>
        </div>
      </Card>

      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center justify-between gap-4 rounded-card bg-primary p-5">
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-surface">
              Confirmar a minha rotação
            </span>
            <span className="text-base text-primary-soft">
              Vais ver o diagnóstico da agrônoma antes de guardar.
            </span>
          </div>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-14 shrink-0 items-center gap-2.5 rounded-full bg-surface px-6 text-lg font-bold text-primary transition-opacity hover:opacity-90"
          >
            Ver o diagnóstico
            <ArrowRight size={20} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
