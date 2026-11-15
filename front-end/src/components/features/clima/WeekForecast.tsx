"use client";

import React from "react";
import { Cloud, CloudRain, Sun } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconBox } from "@/components/ui/IconBox";
import type { AgroSummary, DailyPoint } from "@/types/nasa";

export interface WeekForecastProps {
  summary: AgroSummary | null;
  loading?: boolean;
}

const CONDITION_ICON = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
} as const;

/**
 * Os últimos 7 dias com medição do satélite.
 *
 * A NASA POWER só disponibiliza histórico — por isso o cabeçalho diz
 * "os últimos 7 dias" e não "previsão". Transparência > promessa.
 */
export function WeekForecast({ summary, loading = false }: WeekForecastProps) {
  const days = summary?.last7 ?? [];

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
            Os últimos 7 dias
          </h2>
          <span className="text-base text-text-muted">
            Clique num dia para ouvir a leitura em voz alta
          </span>
        </div>
        {loading && (
          <span className="text-base text-text-muted">A carregar…</span>
        )}
      </div>

      {days.length === 0 ? (
        <div className="rounded-input border border-dashed border-border px-6 py-10 text-center">
          <p className="text-lg font-bold text-text-primary">
            Sem observações para mostrar
          </p>
          <p className="mt-1 text-base text-text-secondary">
            O satélite ainda não passou por esta região. Tente novamente mais
            tarde.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((day: DailyPoint) => {
            const Icon = CONDITION_ICON[day.condition];
            return (
              <button
                key={day.date}
                type="button"
                className="flex flex-col items-center gap-2 rounded-input bg-surface-soft p-4 transition-colors hover:bg-primary-soft"
              >
                <span className="text-base font-bold text-text-secondary">
                  {day.dayOfWeek}
                </span>
                <span className="text-2xl font-bold text-text-primary tabular-nums">
                  {day.dayNumber}
                </span>
                <IconBox icon={Icon} tone="surface" size="lg" />
                <span className="text-lg font-bold text-text-primary tabular-nums">
                  {Math.round(day.tMax)}°
                </span>
                <span className="text-sm text-text-muted tabular-nums">
                  {Math.round(day.tMin)}°
                </span>
                <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-primary">
                  {Math.round(day.rainMm)} mm
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
