"use client";

import React from "react";
import { Bean, Carrot, Leaf, Plus, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconBox } from "@/components/ui/IconBox";
import horta from "@/data/horta.json";

const PLANT_ICONS = {
  sprout: Sprout,
  leaf: Leaf,
  bean: Bean,
  carrot: Carrot,
} as const;

const PLOT_NAMES: Record<string, string> = Object.fromEntries(
  horta.canteiros.map((c) => [c.id, c.name]),
);

export interface PlantListProps {
  onAdd?: () => void;
}

/**
 * "Minhas plantas" — o que está plantado e o que precisa de atenção.
 */
export function PlantList({ onAdd }: PlantListProps) {
  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
            Minhas plantas
          </h2>
          <span className="text-base text-text-muted">
            Toque para ver os cuidados de cada uma
          </span>
        </div>
        <Button icon={Plus} onClick={onAdd}>
          Nova planta
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {horta.plantas.map((plant) => {
          const Icon = PLANT_ICONS[plant.icon as keyof typeof PLANT_ICONS] ?? Sprout;

          return (
            <button
              key={plant.id}
              type="button"
              className="flex items-center gap-4 rounded-input bg-surface-soft p-4 text-left transition-colors hover:bg-primary-soft"
            >
              <IconBox icon={Icon} tone="surface" />

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-lg font-bold text-text-primary">
                  {plant.name}
                </span>
                <span className="text-sm text-text-muted">
                  {PLOT_NAMES[plant.plotId] ?? plant.plotId}
                </span>
                <span className="text-base text-text-secondary">
                  {plant.care}
                </span>
              </div>

              <Badge
                tone={plant.tone === "primary" ? "primary" : "neutral"}
                className="shrink-0"
              >
                {plant.status}
              </Badge>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
