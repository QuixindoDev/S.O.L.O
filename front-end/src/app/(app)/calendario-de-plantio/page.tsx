import React from "react";
import { CalendarioPlantio } from "@/components/features/plantio/CalendarioPlantio";
import { getFarmProfile } from "@/lib/api/server";
import { getAgroSummary } from "@/lib/nasa/client";

/**
 * Ecrã 10 — "Calendário de Plantio".
 *
 * Para desenhar o calendário com a chuva real do ano, o ecrã precisa
 * dos 365 dias de dados da NASA POWER (os outros ecrãs usam 90).
 *
 * As coordenadas vêm do perfil no back-end (GET /api/v1/profile).
 *
 * ISR: revalidado uma vez por dia.
 */
export const revalidate = 86400;

export default async function CalendarioPlantioPage() {
  const profile = await getFarmProfile();

  const summary = await getAgroSummary(
    profile.latitude,
    profile.longitude,
    365,
  );

  return (
    <CalendarioPlantio
      summary={summary}
      soil={profile.soil}
      locationLabel={profile.locationLabel}
    />
  );
}
