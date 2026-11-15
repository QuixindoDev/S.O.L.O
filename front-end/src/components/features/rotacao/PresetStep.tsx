"use client";

import React from "react";
import { ArrowRight, Check, Coins, Droplets, SlidersHorizontal, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { CYCLE_PERIODS, CYCLE_STAGES, ROTATION_PLANS } from "@/lib/rotacao";
import type { CropProfile } from "@/types/agronomy";

const ICONS: Record<"water" | "sprout" | "coins", LucideIcon> = {
  water: Droplets,
  sprout: Sprout,
  coins: Coins,
};

export interface PresetStepProps {
  /** Plano activo. */
  activePlanId: string;
  onSelect: (planId: string) => void;
  /** Avança para o diagnóstico. */
  onNext: () => void;
  /** Abre o Plano 4 (montar do meu jeito). */
  onAdvanced: () => void;
  /** Culturas — para mostrar os nomes de cada ciclo. */
  crops: CropProfile[];
}

/**
 * Passo 2 — "Escolhe uma combinação pronta".
 *
 * As 3 rotas testadas pela NASA, lado a lado, com as 3 culturas de
 * cada rota e o período de cada ciclo. Escolher um plano preenche
 * logo a rotação — a pessoa não tem de mexer em selectores.
 */
export function PresetStep({
  activePlanId,
  onSelect,
  onNext,
  onAdvanced,
  crops,
}: PresetStepProps) {
  const nameOf = (cropId: string) =>
    crops.find((c) => c.id === cropId)?.name ?? cropId;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-text-primary">
        1 · Escolhe uma combinação pronta
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {ROTATION_PLANS.map((plan) => {
          const Icon = ICONS[plan.icon];
          const active = plan.id === activePlanId;

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan.id)}
              aria-pressed={active}
              className={cn(
                "flex flex-col gap-3 rounded-card border p-5 text-left transition-colors",
                active
                  ? "border-2 border-primary bg-surface"
                  : "border-border bg-surface-soft hover:bg-surface",
              )}
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] bg-primary-soft">
                  <Icon size={24} className="text-primary" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-lg font-bold text-text-primary">
                    {plan.title}
                  </span>
                  <span className="text-sm text-text-muted">{plan.subtitle}</span>
                </span>
              </span>

              <span aria-hidden className="h-px w-full bg-border" />

              <span className="flex flex-col gap-2">
                {plan.crops.map((cropId, index) => (
                  <span key={cropId} className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-base font-bold text-text-primary">
                        {nameOf(cropId)}
                      </span>
                      <span className="text-sm text-text-muted">
                        {CYCLE_STAGES[index]} · {CYCLE_PERIODS[index]}
                      </span>
                    </span>
                  </span>
                ))}
              </span>

              <span className="text-base leading-snug text-text-secondary">
                {plan.description}
              </span>

              <span>
                {active ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-surface">
                    <Check size={15} strokeWidth={3} aria-hidden />
                    Escolhido
                  </span>
                ) : (
                  <span className="inline-flex rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-bold text-text-secondary">
                    Escolher este
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center justify-between gap-4 rounded-card bg-primary p-5">
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-surface">
              Tens a tua rotação pronta
            </span>
            <span className="text-base text-primary-soft">
              Agora vou explicar, em português simples, o que esta rotação
              faz pela tua terra.
            </span>
          </div>

          <button
            type="button"
            onClick={onNext}
            className="inline-flex h-14 shrink-0 items-center gap-2.5 rounded-full bg-surface px-6 text-lg font-bold text-primary transition-opacity hover:opacity-90"
          >
            Ver o diagnóstico
            <ArrowRight size={20} aria-hidden />
          </button>
        </div>

        <button
          type="button"
          onClick={onAdvanced}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-full px-4 text-base font-bold text-text-secondary transition-colors hover:bg-surface-soft"
        >
          <SlidersHorizontal size={18} aria-hidden />
          Montar do meu jeito
        </button>
      </div>
    </div>
  );
}
