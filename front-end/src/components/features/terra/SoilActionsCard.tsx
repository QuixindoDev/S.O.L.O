"use client";

import React from "react";
import { Droplets, Package, Sprout } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconBox } from "@/components/ui/IconBox";
import type { SoilMoisture } from "@/lib/agronomia";

export interface SoilActionsCardProps {
  moisture: SoilMoisture;
}

interface Action {
  title: string;
  description: string;
  icon: typeof Droplets;
  urgent: boolean;
}

/**
 * "O que fazer com a terra agora" — três acções concretas.
 * A rega aparece primeiro quando o solo está seco, porque é o que
 * a Dona Maria precisa de fazer primeiro.
 */
export function SoilActionsCard({ moisture }: SoilActionsCardProps) {
  const actions: Action[] = [
    {
      title: "Regar",
      description:
        moisture.status === "ideal"
          ? "Use 20 litros no canteiro da horta, de manhã cedo"
          : "Precisa mesmo de regar: 20 litros no canteiro da horta",
      icon: Droplets,
      urgent: moisture.status !== "ideal",
    },
    {
      title: "Adubar",
      description: "A hora boa é de manhã cedo, antes do sol forte",
      icon: Package,
      urgent: false,
    },
    {
      title: "Plantar",
      description:
        moisture.status === "ideal"
          ? "A terra do canteiro principal está pronta"
          : "Espere a terra secar um pouco antes de plantar",
      icon: Sprout,
      urgent: false,
    },
  ];

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
        O que fazer com a terra agora
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              type="button"
              className="flex flex-col gap-2.5 rounded-input bg-surface-soft p-5 text-left transition-colors hover:bg-primary-soft"
            >
              <IconBox
                icon={Icon}
                tone={action.urgent ? "warning" : "surface"}
              />
              <span className="text-lg font-bold text-text-primary">
                {action.title}
              </span>
              <span className="text-base leading-snug text-text-secondary">
                {action.description}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
