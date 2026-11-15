/**
 * Pesos do índice S.O.L.O. (0-100) conforme a prioridade do produtor.
 *
 * O índice tem três pilares:
 *  - Água   : eficiência hídrica da combinação de culturas
 *  - Solo   : regeneração e fixação de nitrogénio
 *  - Seca   : resiliência climática (tolerância à seca e ao calor)
 *
 * A prioridade escolhida pelo produtor define o peso de cada pilar.
 */

import type { FarmerPriority, SimulationResult } from "@/types/agronomy";

export interface ScoreWeights {
  agua: number;
  solo: number;
  resiliencia: number;
}

export const PRIORIDADES: {
  id: FarmerPriority;
  label: string;
  description: string;
  weights: ScoreWeights;
}[] = [
  {
    id: "agua",
    label: "Economizar Água",
    description: "Guardar cada gota de chuva",
    weights: { agua: 0.5, solo: 0.25, resiliencia: 0.25 },
  },
  {
    id: "solo",
    label: "Cuidar do Solo",
    description: "Voltar o nitrogénio para a terra",
    weights: { agua: 0.25, solo: 0.5, resiliencia: 0.25 },
  },
  {
    id: "lucro",
    label: "Ganhar Dinheiro",
    description: "Ter uma boa safra para vender",
    weights: { agua: 0.33, solo: 0.33, resiliencia: 0.34 },
  },
  {
    id: "resiliencia",
    label: "Evitar Seca",
    description: "Proteger contra o sol forte",
    weights: { agua: 0.3, solo: 0.2, resiliencia: 0.5 },
  },
];

export function pesosDaPrioridade(prioridade: FarmerPriority): ScoreWeights {
  return PRIORIDADES.find((p) => p.id === prioridade)?.weights ?? PRIORIDADES[2].weights;
}

/** Limita um valor bruto ao intervalo 10-99 usado nos scores públicos. */
export function normalizarScore(valor: number): number {
  return Math.max(10, Math.min(99, Math.round(valor)));
}

/** Score final ponderado pela prioridade do produtor. */
export function calcularScoreFinal(
  agua: number,
  solo: number,
  resiliencia: number,
  prioridade: FarmerPriority
): number {
  const pesos = pesosDaPrioridade(prioridade);
  return Math.round(
    agua * pesos.agua + solo * pesos.solo + resiliencia * pesos.resiliencia
  );
}

/** Classificação do score em linguagem simples (sem jargão). */
export function classificarResiliencia(
  score: number
): SimulationResult["resilienceRating"] {
  if (score >= 80) return "Excelente";
  if (score >= 50) return "Atenção ao Stresse Hídrico";
  return "Alto Risco de Quebra";
}

/** Cor do medidor circular conforme o score. */
export function corDoScore(score: number): string {
  if (score >= 80) return "#006B2C";
  if (score >= 50) return "#8A5A00";
  return "#B3261E";
}

/** Texto curto que explica o score ao produtor. */
export function explicarScore(score: number): string {
  if (score >= 80) {
    return "A sua combinação está muito boa. Dá para contar com esta safra.";
  }
  if (score >= 65) {
    return "A sua combinação está boa. Com um cuidado a mais na água, fica melhor.";
  }
  if (score >= 50) {
    return "Atenção: a sua combinação precisa de água e de cobertura do solo.";
  }
  if (score >= 30) {
    return "Esta combinação está fraca. Troque a cultura da entressafra por uma leguminosa.";
  }
  return "Esta combinação é arriscada. Fale com a Agrónoma antes de semear.";
}
