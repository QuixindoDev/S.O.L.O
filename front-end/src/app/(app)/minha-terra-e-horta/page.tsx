import React from "react";
import { Satellite } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PlotsCard } from "@/components/features/terra/PlotsCard";
import { SoilActionsCard } from "@/components/features/terra/SoilActionsCard";
import { SoilStatusCard } from "@/components/features/terra/SoilStatusCard";
import { estimateSoilMoisture } from "@/lib/agronomia";
import { defaultFarm } from "@/lib/farm";
import { getAgroSummary } from "@/lib/nasa/client";

/**
 * Ecrã 7 — "Minha Terra e Horta".
 *
 * A humidade do solo é estimada a partir da chuva e da evaporação
 * reais da NASA POWER, com um balanço hídrico de duas camadas
 * (ver `src/lib/agronomia.ts`).
 *
 * ISR: revalidado uma vez por dia, em sincronia com a NASA POWER.
 */
export const revalidate = 86400;

export default async function MinhaTerraPage() {
  const summary = await getAgroSummary(
    defaultFarm.latitude,
    defaultFarm.longitude,
  );

  const moisture = estimateSoilMoisture(summary, defaultFarm.soil);

  // A mesma leitura aplica-se a todos os canteiros, com um desvio
  // para a Baixa do Riacho — que fica mais perto do riacho e enxuga
  // mais depressa.
  const moistureByPlot = {
    canteiro_principal: moisture.rootZonePct,
    horta_cozinha: Math.max(0, moisture.rootZonePct - 14),
    baixa_riacho: Math.max(0, moisture.rootZonePct - 37),
  };

  return (
    <AppShell
      title="Minha Terra e Horta"
      subtitle="O que o satélite vê no seu solo"
      location={defaultFarm.locationLabel}
    >
      <div className="flex flex-col gap-5">
        <SoilStatusCard moisture={moisture} />

        <PlotsCard moistureByPlot={moistureByPlot} />

        <SoilActionsCard moisture={moisture} />

        {/* Transparência sobre os dados */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-input border border-border bg-surface px-5 py-3.5">
          <span className="flex items-center gap-2 text-sm font-bold text-text-muted">
            <Satellite size={16} className="shrink-0" aria-hidden />
            Fonte: NASA POWER + modelo de balanço hídrico (FAO-56)
          </span>
          <span className="text-sm text-text-muted">
            Humidade estimada, não medida — a NASA SMAP dá a medição
            directa.
          </span>
          <span className="text-sm text-text-muted">
            Chuva nos últimos 7 dias: {moisture.rainTotalMm} mm
          </span>
        </div>
      </div>
    </AppShell>
  );
}
