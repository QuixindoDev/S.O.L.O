"use client";

import React from "react";
import { Bean, Carrot, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconBox } from "@/components/ui/IconBox";
import horta from "@/data/horta.json";

const PLOT_ICONS = {
  sprout: Sprout,
  carrot: Carrot,
  bean: Bean,
} as const;

export interface PlotsCardProps {
  /** Humidade estimada por canteiro (id → %) */
  moistureByPlot?: Record<string, number>;
}

/**
 * "Meus canteiros" — cada canteiro da Dona Maria, com a humidade
 * estimada a partir do mesmo modelo de solo.
 */
export function PlotsCard({ moistureByPlot = {} }: PlotsCardProps) {
  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
          Meus canteiros
        </h2>
        <span className="text-base text-text-muted">
          Toque num canteiro para ver o detalhe
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {horta.canteiros.map((plot) => {
          const Icon = PLOT_ICONS[plot.icon as keyof typeof PLOT_ICONS] ?? Sprout;
          const pct = moistureByPlot[plot.id];

          const tone =
            pct === undefined
              ? "neutral"
              : pct >= 60
                ? "primary"
                : pct >= 35
                  ? "warning"
                  : "danger";

          const label =
            pct === undefined
              ? "Sem leitura"
              : pct >= 60
                ? "Bom"
                : pct >= 35
                  ? "Precisa de água"
                  : "Seco, cuidado";

          return (
            <button
              key={plot.id}
              type="button"
              className="flex flex-col gap-3 rounded-input bg-surface-soft p-5 text-left transition-colors hover:bg-primary-soft"
            >
              <div className="flex items-center gap-3.5">
                <IconBox icon={Icon} tone="surface" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-lg font-bold text-text-primary">
                    {plot.name}
                  </span>
                  <span className="text-sm text-text-muted">{plot.areaM2} m²</span>
                </div>
              </div>

              <p className="text-base leading-snug text-text-secondary">
                {plot.crops}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-text-muted">
                  {pct === undefined
                    ? "Humidade —"
                    : `Umidade ${pct}%`}
                </span>
                <Badge tone={tone} size="sm">
                  {label}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
