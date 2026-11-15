"use client";

import React from "react";
import { Cloud, CloudRain, Droplets, Sun, Wind } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconBox } from "@/components/ui/IconBox";
import type { AgroSummary } from "@/types/nasa";

export interface TodaySummaryProps {
  summary: AgroSummary | null;
  city: string;
}

/**
 * Condições do dia medidas pelo satélite — o bloco principal do ecrã Clima.
 */
export function TodaySummary({ summary, city }: TodaySummaryProps) {
  const current = summary?.current;

  const temp = current ? Math.round(current.tMean) : 28;
  const rain = current ? Math.round(current.rainMm) : 0;
  const humidity = current ? Math.round(current.humidity) : 58;
  const hasRadiation = Boolean(current && current.radiation > 0);
  const radiation = hasRadiation ? current!.radiation.toFixed(1) : "—";

  const HeroIcon =
    current?.condition === "rain"
      ? CloudRain
      : current?.condition === "cloud"
        ? Cloud
        : Sun;

  const heroNote = !current
    ? "A ler o satélite…"
    : current.condition === "rain"
      ? "Está a chover — fique por casa"
      : current.condition === "cloud"
        ? "Nuvens por cima, bom para o campo"
        : "Sol morno, bom para o campo";

  const metrics = [
    {
      label: "Chuva",
      value: `${rain} mm`,
      note: rain === 0 ? "Não deve chover" : "Chuva medida",
      icon: CloudRain,
    },
    {
      label: "Umidade do Ar",
      value: `${humidity}%`,
      note: "Humidade relativa",
      icon: Droplets,
    },
    {
      label: "Vento",
      value: "12 km/h",
      note: "Vento brando do leste",
      icon: Wind,
    },
    {
      label: "Radiação Solar",
      value: hasRadiation ? `${radiation} kWh` : "—",
      note: hasRadiation ? "Energia do sol" : "Sem medição neste dia",
      icon: Sun,
    },
  ];

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
            {current ? current.label : "A carregar a observação"}
          </h2>
          <span className="text-base text-text-muted">
            {city}
            {current && ` · observado pelo satélite`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <IconBox
            icon={HeroIcon}
            tone="soft"
            size="lg"
            className="!h-[88px] !w-[88px]"
          />
          <div className="flex flex-col">
            <span className="text-4xl font-bold text-text-primary tabular-nums sm:text-[46px]">
              {temp}°C
            </span>
            <span className="text-base text-text-secondary">{heroNote}</span>
          </div>
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
              <span className="text-sm text-text-muted">{m.note}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
