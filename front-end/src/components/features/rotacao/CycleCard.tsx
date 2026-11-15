"use client";

import React from "react";
import { Bean, Droplets, Sprout, Wheat } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconBox } from "@/components/ui/IconBox";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { CYCLE_PERIODS, CYCLE_STAGES } from "@/lib/rotacao";
import type { CropProfile } from "@/types/agronomy";

const STAGE_ICONS: LucideIcon[] = [Wheat, Bean, Sprout];

export interface CycleCardProps {
  /** 0, 1 ou 2 — a posição do ciclo na safra. */
  index: number;
  /** Cultura escolhida para este ciclo. */
  cropId: string;
  crops: CropProfile[];
  onChange: (cropId: string) => void;
  /** Balanço hídrico do ciclo (mm) — vem da simulação. */
  demandMm?: number;
  rainMm?: number;
}

/**
 * Uma das 3 etapas da rotação (Plano 4 — montar do meu jeito).
 *
 * Mostra a cultura, o período, uma nota simples sobre ela e como
 * fica a água desse ciclo — que é o que a pessoa quer saber.
 */
export function CycleCard({
  index,
  cropId,
  crops,
  onChange,
  demandMm,
  rainMm,
}: CycleCardProps) {
  const crop = crops.find((c) => c.id === cropId);
  const Icon = STAGE_ICONS[index] ?? Sprout;
  const faltaAgua =
    demandMm !== undefined && rainMm !== undefined && rainMm < demandMm;

  const nota =
    index === 0
      ? "A tua maior colheita. Gasta mais água."
      : index === 1
        ? "Aqui a chuva falha. Prepara a rega."
        : "Cobre a terra e protege do sol.";

  return (
    <Card padding="md" className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <IconBox icon={Icon} size="md" tone="soft" />
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-bold text-text-muted">
            {CYCLE_STAGES[index]}
          </span>
          <span className="text-xl font-bold text-text-primary">
            {crop?.name ?? "—"}
          </span>
        </div>
      </div>

      <Select
        value={cropId}
        onChange={onChange}
        options={crops.map((c) => ({
          value: c.id,
          label: c.name,
          description: c.description,
        }))}
      />

      <span className="text-sm text-text-muted">{CYCLE_PERIODS[index]}</span>

      <p className="text-base leading-snug text-text-secondary">{nota}</p>

      {demandMm !== undefined && rainMm !== undefined && (
        <p
          className={cn(
            "flex items-center gap-2 text-sm font-bold",
            faltaAgua ? "text-warning" : "text-primary",
          )}
        >
          <Droplets size={16} aria-hidden />
          Precisa {demandMm} mm · Chove {rainMm} mm
        </p>
      )}
    </Card>
  );
}
