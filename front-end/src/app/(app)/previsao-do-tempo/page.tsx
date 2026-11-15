import React from "react";
import { Satellite } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { NasaAlerts } from "@/components/features/clima/NasaAlerts";
import { TodaySummary } from "@/components/features/clima/TodaySummary";
import { WeekForecast } from "@/components/features/clima/WeekForecast";
import { defaultFarm } from "@/lib/farm";
import { getAgroSummary } from "@/lib/nasa/client";

/**
 * Ecrã 6 — "Previsão do Tempo" (NASA POWER).
 *
 * Server Component: a série do satélite é buscada no servidor com
 * cache de 24h na edge e chega completa no HTML inicial.
 *
 * ISR: revalidado uma vez por dia, em sincronia com a NASA POWER.
 */
export const revalidate = 86400;
export default async function ClimaPage() {
  const summary = await getAgroSummary(
    defaultFarm.latitude,
    defaultFarm.longitude,
  );

  const pass = summary.lastSatellitePass;
  const passLabel = pass
    ? `${pass.slice(6, 8)}/${pass.slice(4, 6)}/${pass.slice(0, 4)}`
    : "sem dados";

  return (
    <AppShell
      title="Previsão do Tempo"
      subtitle="Dados do satélite NASA POWER"
      location={defaultFarm.locationLabel}
    >
      <div className="flex flex-col gap-5">
        <TodaySummary summary={summary} city={defaultFarm.city} />

        <WeekForecast summary={summary} />

        <NasaAlerts summary={summary} />

        {/* Transparência sobre os dados (NFR-06) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-input border border-border bg-surface px-5 py-3.5">
          <span className="flex items-center gap-2 text-sm font-bold text-text-muted">
            <Satellite size={16} className="shrink-0" aria-hidden />
            Fonte: NASA POWER · Agroclimatology
          </span>
          <span className="text-sm text-text-muted">
            Última observação do satélite: {passLabel}
          </span>
          <span className="text-sm text-text-muted">
            Isto é apoio à decisão, não uma previsão garantida.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
