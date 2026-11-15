import React from "react";
import { RotationWizard } from "@/components/features/rotacao/RotationWizard";
import { api } from "@/lib/api/endpoints";
import { getFarmProfile } from "@/lib/api/server";
import { getAgroSummary } from "@/lib/nasa/client";

/**
 * Ecrã 5 — "Rotação de Culturas" (simulador).
 *
 * O simulador precisa de **um ano inteiro** de chuva e radiação para
 * comparar a demanda de cada cultura com a água que cai em cada mês —
 * por isso aqui buscamos 365 dias (os outros ecrãs usam 90).
 *
 * As coordenadas e a textura do solo vêm do perfil no back-end
 * (GET /api/v1/profile).
 *
 * ISR: revalidado uma vez por dia.
 */
export const revalidate = 86400;

export default async function RotacaoPage() {
  const profile = await getFarmProfile();

  const [summary, leguminosas] = await Promise.all([
    getAgroSummary(profile.latitude, profile.longitude, 365),
    api.crops
      .catalog({ revalidate: 86400 })
      .then((catalogo) => catalogo.leguminosas_regenerativas)
      .catch(() => []),
  ]);

  return (
    <RotationWizard
      summary={summary}
      soil={profile.soil}
      latitude={profile.latitude}
      longitude={profile.longitude}
      locationLabel={profile.locationLabel}
      areaHectares={profile.areaHectares}
      farmName={profile.farmName}
      leguminosas={leguminosas}
    />
  );
}
