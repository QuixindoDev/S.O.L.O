/**
 * Carbono da terra — a renda que a rotação produz.
 *
 * Cada cultura guarda uma quantidade de carbono no solo (medida em
 * toneladas de CO₂ equivalente por hectare e por ano). Uma terra
 * sempre coberta guarda muito mais do que uma terra descoberta.
 *
 * O carbono guardado vira crédito de carbono e esse crédito vira
 * dinheiro para o agricultor — é a "renda da minha terra".
 */

import { cropById, type Planting } from "@/lib/plantio";
import { MONTHS_LONG } from "@/lib/plantio";

/** Preço de mercado de uma tonelada de CO₂e, em kwanzas. */
export const PRECO_POR_TONELADA_KZ = 1250;

/**
 * Margem de segurança (20%) — a mesma do back-end: uma parte do
 * carbono fica "guardada" para o caso de a captura se reverter.
 */
export const MARGEM_SEGURANCA = 0.2;

/** Um mês da renda de carbono. */
export interface CarbonoMes {
  /** Mês do ano (0-11). */
  mes: number;
  /** Nome do mês ("Agosto"). */
  nome: string;
  /** Toneladas de CO₂e captadas nesse mês. */
  tco2e: number;
  /** Dinheiro gerado nesse mês (kz). */
  kz: number;
  /** O que está a acontecer na terra nesse mês. */
  descricao: string;
}

/** Resumo da renda de carbono do ano. */
export interface ResumoCarbono {
  /** Taxa média da rotação (tCO₂e/ha/ano). */
  taxaMedia: number;
  /** Carbono capturado no ano (tCO₂e). */
  tco2eBruto: number;
  /** Carbono líquido, depois da margem de segurança. */
  tco2eLiquido: number;
  /** Renda gerada no ano (kz). */
  rendaKz: number;
  /** Área da terra (ha). */
  areaHa: number;
  /** Renda mês a mês (do mais antigo para o mais recente). */
  porMes: CarbonoMes[];
}

/**
 * Calcula a renda de carbono a partir da rotação (plantios) e da
 * área da terra.
 *
 * O carbono é distribuído pelos meses que cada cultura ocupa: uma
 * cultura semeada em 4 meses guarda carbono durante esses 4 meses.
 */
export function calcularRendaCarbono(
  plantings: Planting[],
  areaHa: number,
): ResumoCarbono {
  // Taxa média da rotação (tCO₂e/ha/ano): a terra só captura uma vez
  // por mês — quem cobre o solo é que captura.
  const taxaDe = (cropId: string) => cropById(cropId)?.carbonoTco2eHa ?? 2;

  // Carbono por mês: a cultura que está no chão nesse mês reparte a
  // sua taxa anual pelos 12 meses do ano.
  const porMesNum = new Array(12).fill(0);
  for (const planting of plantings) {
    const porMes = (taxaDe(planting.cropId) / 12) * areaHa;
    for (const mes of planting.meses) {
      porMesNum[mes] = Math.max(porMesNum[mes], porMes);
    }
  }

  const tco2eBruto = porMesNum.reduce((s, v) => s + v, 0);
  const taxaMedia = areaHa > 0 ? tco2eBruto / areaHa : 0;
  const tco2eLiquido = tco2eBruto * (1 - MARGEM_SEGURANCA);
  const rendaKz = tco2eLiquido * PRECO_POR_TONELADA_KZ;

  const porMes: CarbonoMes[] = porMesNum.map((tco2e, mes) => ({
    mes,
    nome: MONTHS_LONG[mes],
    tco2e: Math.round(tco2e * 10) / 10,
    kz: Math.round(tco2e * (1 - MARGEM_SEGURANCA) * PRECO_POR_TONELADA_KZ),
    descricao: descricaoDoMes(plantings, mes),
  }));

  return {
    taxaMedia: Math.round(taxaMedia * 100) / 100,
    tco2eBruto: Math.round(tco2eBruto * 10) / 10,
    tco2eLiquido: Math.round(tco2eLiquido * 10) / 10,
    rendaKz: Math.round(rendaKz),
    areaHa,
    porMes,
  };
}

/** O que está a acontecer na terra num determinado mês. */
function descricaoDoMes(plantings: Planting[], mes: number): string {
  const activas = plantings.filter((p) => p.meses.includes(mes));
  if (activas.length === 0) return "Terra sem cultura — o carbono escapa";

  const primeira = activas[0];
  const nome = cropById(primeira.cropId)?.name ?? "A cultura";

  if (primeira.ciclo === 2) return `${nome} a proteger o solo do calor`;
  if (primeira.ciclo === 1) return `${nome} a aproveitar a humidade que resta`;
  return `${nome} na fase de crescimento`;
}

/** "kz 2.480,00" — o formato angolano (ponto nos milhares, vírgula nos cêntimos). */
export function formatarKz(valor: number): string {
  const [inteiro, decimais] = valor.toFixed(2).split(".");
  const comPontos = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `kz ${comPontos},${decimais}`;
}

/** "12,4 tCO₂e" */
export function formatarTco2e(valor: number): string {
  return `${valor.toLocaleString("pt-PT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} tCO₂e`;
}
