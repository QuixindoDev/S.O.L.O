/**
 * Fórmulas agronómicas usadas pelo S.O.L.O.
 *
 * Fontes: FAO-56 (Hargreaves/Sazaba), Cury et al. (balanço hídrico),
 * Villamil et al. (GDD para estádios).
 *
 * Objectivo: traduzir números de satélite em conselhos que uma pessoa
 * com mais de 60 anos consiga aplicar no campo sem equipamento adicional.
 */

import type { SoilTextureType } from "@/types/agronomy";

/** Temperatura base (°C) por tipo de cultura. */
export const TEMPERATURA_BASE = {
  cereal: 10,
  legume: 10,
  oilseed: 6,
  cover_crop: 8,
  tuber: 13,
} as const;

/** Coeficiente de cultura (Kc) médio por fase, segundo a FAO-56. */
export const Kc_CULTURA = {
  milho: { inicial: 0.3, desenvolvimento: 0.7, medio: 1.2, final: 0.6 },
  soja: { inicial: 0.4, desenvolvimento: 0.8, medio: 1.15, final: 0.5 },
  feijao_caupi: { inicial: 0.4, desenvolvimento: 0.7, medio: 1.1, final: 0.5 },
  sorgo: { inicial: 0.3, desenvolvimento: 0.65, medio: 1.0, final: 0.55 },
  gergelim: { inicial: 0.35, desenvolvimento: 0.7, medio: 1.0, final: 0.5 },
  girassol: { inicial: 0.35, desenvolvimento: 0.7, medio: 1.05, final: 0.5 },
  braquiaria: { inicial: 0.4, desenvolvimento: 0.8, medio: 1.15, final: 0.6 },
  crotalaria: { inicial: 0.4, desenvolvimento: 0.75, medio: 1.1, final: 0.6 },
  pousio_desnudo: { inicial: 0.1, desenvolvimento: 0.1, medio: 0.1, final: 0.1 },
} as const;

export type CropId = keyof typeof Kc_CULTURA;
export type CropPhase = keyof (typeof Kc_CULTURA)["milho"];

/**
 * ETP0 de Hargreaves-Sazaba (mm/dia).
 * @param tMedia Temperatura média do ar (°C)
 * @param tMax Temperatura máxima (°C)
 * @param tMin Temperatura mínima (°C)
 * @param latitude Latitude em graus decimais
 */
export function et0Hargreaves(
  tMedia: number,
  tMax: number,
  tMin: number,
  latitude: number
): number {
  const amplitude = Math.max(0, tMax - tMin);
  const factor = 0.0023 * (latitude * (Math.PI / 180)) * 0.408;
  const et0 = factor * Math.sqrt(amplitude) * (tMedia + 17.8);
  return Math.max(0, Number(et0.toFixed(2)));
}

/**
 * Graus-dia de crescimento (GDD) — soma térmica desde a germinação.
 */
export function gdd(tMax: number, tMin: number, temperaturaBase = 10): number {
  const media = (tMax + tMin) / 2;
  return Math.max(0, Number((media - temperaturaBase).toFixed(2)));
}

/**
 * Balanço hídrico simples: chuva útil menos evapotranspiração.
 * Positivo = sobra de água no solo; negativo = défice.
 */
export function balancoHidrico(precipitacaoMm: number, et0Mm: number): number {
  return Number((precipitacaoMm - et0Mm).toFixed(1));
}

/**
 * Balanço hídrico accumulated ao longo de um ciclo (mm).
 */
export function balancoHidricoAcumulado(
  precipitacaoTotalMm: number,
  et0TotalMm: number
): number {
  return Number((precipitacaoTotalMm - et0TotalMm).toFixed(1));
}

/**
 * Necessidade hídrica da cultura: ETc = ETP0 x Kc.
 */
export function etc(et0Mm: number, kc: number): number {
  return Number((et0Mm * kc).toFixed(2));
}

/**
 * CoefBOL (coeficiente de cobertura do solo) por textura.
 * Areia retém menos água; argila mais, mas com recorência a encharcamento.
 */
export function coeficienteBolo(soil: SoilTextureType): number {
  switch (soil) {
    case "arenoso":
      return 0.55;
    case "argiloso":
      return 0.9;
    case "franco":
      return 0.75;
  }
}

/**
 * Necessidade de rega (mm) para cobrir o défice hídrico do período,
 * assumindo rega manual com eficiência de aplicação de 70 % (regador improvisado).
 */
export function necessidadeDeRega(
  balancoHidricoMm: number,
  soil: SoilTextureType,
  eficienciaAplicacao = 0.7
): number {
  if (balancoHidricoMm >= 0) return 0;
  const bruto = Math.abs(balancoHidricoMm) / coeficienteBolo(soil);
  return Math.round(bruto / eficienciaAplicacao);
}

/**
 * Converte a necessidade de rega em litros por metro quadrado
 * (1 mm de água = 1 L/m²) e depois em baldes de 20 L.
 */
export function litrosPorBalde(
  milimetros: number,
  metrosQuadrados: number,
  litrosPorBalde = 20
): number {
  const litros = milimetros * metrosQuadrados;
  return Math.max(1, Math.ceil(litros / litrosPorBalde));
}

/**
 * Classificação do risco hídrico a partir do balanço do solo.
 */
export type RiscoHidrico = "baixo" | "moderado" | "alto" | "extremo";

export function classificarRiscoHidrico(balancoHidricoMm: number): RiscoHidrico {
  if (balancoHidricoMm >= 0) return "baixo";
  if (balancoHidricoMm >= -20) return "moderado";
  if (balancoHidricoMm >= -50) return "alto";
  return "extremo";
}

/**
 * Estado da humidade da zona radicular (SMAP, 0-1).
 * 0.25-0.55 é a faixa ótima para a maioria das culturas de sequeiro.
 */
export type EstadoHumidade = "seco" | "precisa_agua" | "ideal" | "encharcado";

export function classificarHumidade(humidadeRaiz: number): EstadoHumidade {
  if (humidadeRaiz < 0.2) return "seco";
  if (humidadeRaiz < 0.28) return "precisa_agua";
  if (humidadeRaiz <= 0.55) return "ideal";
  return "encharcado";
}

/**
 * Días médios de crescimento para um conjunto de temperaturas
 * (simplificação de Villamil et al. — regime térmico de Angola).
 */
export function diasParaMaturacao(
  gddAcumulado: number,
  gddTotalNecessario: number,
  gddDiarioMedio: number
): number {
  if (gddDiarioMedio <= 0) return 0;
  const restante = Math.max(0, gddTotalNecessario - gddAcumulado);
  return Math.ceil(restante / gddDiarioMedio);
}
