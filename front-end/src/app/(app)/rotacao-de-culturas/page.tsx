import React from "react";
import { RotationWizard } from "@/components/features/rotacao/RotationWizard";
import { defaultFarm } from "@/lib/farm";
import { getAgroSummary } from "@/lib/nasa/client";

/**
 * Ecrã 5 — "Rotação de Culturas" (simulador).
 *
 * O simulador precisa de **um ano inteiro** de chuva e radiação para
 * comparar a demanda de cada cultura com a água que cai em cada mês —
 * por isso aqui buscamos 365 dias (os outros ecrãs usam 90).
 *
 * ISR: revalidado uma vez por dia.
 */
export const revalidate = 86400;

export default async function RotacaoPage() {
  const summary = await getAgroSummary(
    defaultFarm.latitude,
    defaultFarm.longitude,
    365,
  );

  return <RotationWizard summary={summary} />;
}
