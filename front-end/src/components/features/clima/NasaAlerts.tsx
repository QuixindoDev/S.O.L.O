"use client";

import React from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { AgroSummary } from "@/types/nasa";

export interface NasaAlertsProps {
  summary: AgroSummary | null;
}

/**
 * O que a NASA está a avisar — o semáforo de risco em linguagem simples.
 * Um aviso verde e um amarelo, nunca mais do que dois: a pessoa tem de
 * conseguir ler isto num olhar.
 */
export function NasaAlerts({ summary }: NasaAlertsProps) {
  const daysSinceRain = summary?.daysSinceRain ?? 0;
  const annualRain = summary?.annualRainMm ?? 0;
  const avgTMax = summary?.avgTMax ?? 28;

  const dry = daysSinceRain >= 7;
  const heat = avgTMax >= 33;

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
        O que a NASA está avisando
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {dry ? (
          <div className="flex flex-col gap-2.5 rounded-input bg-warning-soft p-5">
            <div className="flex items-center gap-3">
              <TriangleAlert size={22} className="shrink-0 text-warning" aria-hidden />
              <span className="text-lg font-bold text-text-primary">
                Cuidado com a seca
              </span>
            </div>
            <p className="text-base leading-relaxed text-text-secondary">
              Já passaram {daysSinceRain} dias sem chover por aqui. Regue o
              canteiro de cima amanhã bem cedo, antes do sol. A água do solo
              está a baixar.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 rounded-input bg-warning-soft p-5">
            <div className="flex items-center gap-3">
              <TriangleAlert size={22} className="shrink-0 text-warning" aria-hidden />
              <span className="text-lg font-bold text-text-primary">
                {heat ? "Calor forte à frente" : "Sol forte no campo"}
              </span>
            </div>
            <p className="text-base leading-relaxed text-text-secondary">
              Chega aos {avgTMax}°C durante o dia. Regue de manhã bem cedo ou
              depois das 16h, para a água não evaporar antes de chegar às
              raízes.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2.5 rounded-input bg-primary-soft p-5">
          <div className="flex items-center gap-3">
            <CircleCheck size={22} className="shrink-0 text-primary" aria-hidden />
            <span className="text-lg font-bold text-text-primary">
              Bom dia para plantar
            </span>
          </div>
          <p className="text-base leading-relaxed text-text-secondary">
            Caíram {annualRain} mm de chuva nos últimos 3 meses nesta região.
            A terra vai estar boa para semear e para transplantar as mudas
            novas.
          </p>
        </div>
      </div>
    </Card>
  );
}
