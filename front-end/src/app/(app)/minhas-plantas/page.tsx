import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { GestaoPlantas } from "@/components/features/plantas/GestaoPlantas";
import { api } from "@/lib/api/endpoints";
import { getFarmProfile, getServerToken } from "@/lib/api/server";
import type { HarvestDto, PlantDto, PlotDto } from "@/lib/api/types";

/**
 * Ecrã 8 — "Minhas Plantas".
 *
 * Os dados vêm do back-end (a horta da Dona Maria está no banco):
 *   GET /api/v1/plants
 *   GET /api/v1/harvests
 *   GET /api/v1/plots
 *
 * E a escrita também: POST /api/v1/plants e POST /api/v1/harvests.
 */
export const revalidate = 300;

export default async function MinhasPlantasPage() {
  const [profile, token] = await Promise.all([getFarmProfile(), getServerToken()]);

  const [plants, harvests, plots] = await Promise.all([
    api.plants
      .list(undefined, { token, revalidate: 300 })
      .catch(() => [] as PlantDto[]),
    api.harvests
      .list({ token, revalidate: 300 })
      .catch(() => [] as HarvestDto[]),
    api.plots
      .list({ token, revalidate: 300 })
      .catch(() => [] as PlotDto[]),
  ]);

  return (
    <AppShell
      title="Minhas Plantas"
      subtitle="O que está plantado e o que você colheu"
      location={profile.locationLabel}
    >
      <div className="flex flex-col gap-5">
        <GestaoPlantas plants={plants} harvests={harvests} plots={plots} />
      </div>
    </AppShell>
  );
}
