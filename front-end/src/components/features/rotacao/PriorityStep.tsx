"use client";

import React from "react";
import { ArrowRight, Check, Coins, Droplets, SlidersHorizontal, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { FARMER_GOALS } from "@/lib/rotacao";
import type { FarmerPriority } from "@/types/agronomy";

const ICONS: Record<"water" | "sprout" | "coins", LucideIcon> = {
  water: Droplets,
  sprout: Sprout,
  coins: Coins,
};

export interface PriorityStepProps {
  /** Objectivo escolhido pela pessoa. */
  value: FarmerPriority;
  onChange: (value: FarmerPriority) => void;
  /** Avança para o Passo 2. */
  onNext: () => void;
  /** Abre o Plano 4 (montar do meu jeito). */
  onAdvanced: () => void;
}

/**
 * Passo 1 — "O que queres priorizar este ano?".
 *
 * Três cartões grandes, com uma pergunta por cartão. Nada de
 * selectores técnicos: aqui a pessoa só escolhe o que é mais
 * importante para si neste ano.
 */
export function PriorityStep({
  value,
  onChange,
  onNext,
  onAdvanced,
}: PriorityStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card padding="lg" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
            O que queres priorizar este ano?
          </h2>
          <span className="text-base text-text-muted">
            Escolhe uma opção. A NASA usa os dados da chuva e da tua terra
            para te mostrar a rotação que vai funcionar melhor.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FARMER_GOALS.map((goal) => {
            const Icon = ICONS[goal.icon];
            const active = goal.id === value;

            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => onChange(goal.id)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col justify-between gap-4 rounded-input border p-5 text-left transition-colors",
                  active
                    ? "border-2 border-primary bg-primary-soft"
                    : "border-border bg-surface-soft hover:bg-surface",
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface">
                    <Icon size={28} className="text-primary" aria-hidden />
                  </span>
                  <span className="text-xl font-bold text-text-primary">
                    {goal.title}
                  </span>
                </span>

                <span className="text-base leading-snug text-text-secondary">
                  {goal.description}
                </span>

                <span>
                  {active ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-surface">
                      <Check size={15} strokeWidth={3} aria-hidden />
                      Escolhido
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-bold text-text-secondary">
                      Escolher
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center justify-between gap-4 rounded-card bg-primary p-5">
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-surface">
              Pronto? Vamos ver a tua rotação
            </span>
            <span className="text-base text-primary-soft">
              Demoras menos de 1 minuto. Sem complicações.
            </span>
          </div>

          <button
            type="button"
            onClick={onNext}
            className="inline-flex h-14 shrink-0 items-center gap-2.5 rounded-full bg-surface px-6 text-lg font-bold text-primary transition-opacity hover:opacity-90"
          >
            Ver a minha rotação
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
