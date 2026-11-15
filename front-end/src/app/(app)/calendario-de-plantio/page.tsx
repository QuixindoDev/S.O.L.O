import React from "react";
import { CalendarioPlantio } from "@/components/features/plantio/CalendarioPlantio";
import { defaultFarm } from "@/lib/farm";
import { getAgroSummary } from "@/lib/nasa/client";

/**
 * Ecrã 10 — "Calendário de Plantio".
 *
 * Para desenhar o calendário com a chuva real do ano, o ecrã precisa
 * dos 365 dias de dados da NASA POWER (os outros ecrãs usam 90).
 *
 * ISR: revalidado uma vez por dia.
 */
export const revalidate = 86400;

export default async function CalendarioPlantioPage() {
  const summary = await getAgroSummary(
    defaultFarm.latitude,
    defaultFarm.longitude,
    365,
  );

  return <CalendarioPlantio summary={summary} />;
}
