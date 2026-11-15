"use client";

import React from "react";
import { Droplets, Sun, Thermometer, Waves } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconBox } from "@/components/ui/IconBox";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { SoilMoisture } from "@/lib/agronomia";

export interface SoilStatusCardProps {
  moisture: SoilMoisture;
}

/**
 * "Como está a sua terra" — o estado do solo medido/estimado
 * a partir dos dados da NASA POWER.
 */
export function SoilStatusCard({ moisture }: SoilStatusCardProps) {
  const metrics = [
    {
      label: "Umidade na Raiz",
      value: `${moisture.rootZonePct}%`,
      note:
        moisture.rootZonePct >= 60
          ? "Na medida certa para plantar"
          : "As raízes estão com sede",
      icon: Droplets,
    },
    {
      label: "Umidade na Superfície",
      value: `${moisture.surfacePct}%`,
      note:
        moisture.surfacePct >= 50
          ? "O solo de cima está úmido"
          : "O solo de cima está seco",
      icon: Waves,
    },
    {
      label: "Temperatura do Solo",
      value: `${moisture.soilTemperatureC}°C`,
      note: "Frio bom para as raízes",
      icon: Thermometer,
    },
    {
      label: "Dias sem Chuva",
      value: `${moisture.daysSinceRain} dias`,
      note:
        moisture.daysSinceRain === 0
          ? "Choveu no último dia"
          : `Sem chuva há ${moisture.daysSinceRain} dias`,
      icon: Sun,
    },
  ];

  return (
    <Card padding="lg" className="flex flex-col gap-5 ">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
            Como está a sua terra
          </h2>
          <span className="text-base text-text-muted">
            Umidade do solo estimada a partir da NASA POWER
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ScoreRing
            value={moisture.rootZonePct}
            label={moisture.statusLabel}
            size={130}
            tone={moisture.status === "seco" ? "warning" : "primary"}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="flex flex-col gap-2 rounded-input bg-surface-soft p-4"
            >
              <IconBox icon={Icon} tone="surface" size="sm" />
              <span className="text-sm text-text-muted">{m.label}</span>
              <span className="text-xl font-bold text-text-primary sm:text-2xl">
                {m.value}
              </span>
              <span className="text-sm leading-snug text-text-muted">
                {m.note}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-input bg-primary-soft px-5 py-4">
        <Badge tone={moisture.status === "ideal" ? "primary" : "warning"}>
          {moisture.statusLabel}
        </Badge>
        <p className="min-w-0 flex-1 text-base text-text-secondary">
          {moisture.advice}
        </p>
      </div>
    </Card>
  );
}
