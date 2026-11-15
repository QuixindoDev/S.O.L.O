/**
 * Converte a resposta crua da NASA POWER em dados prontos a mostrar.
 *
 * A NASA devolve séries diárias indexadas por `YYYYMMDD` e usa `-999.0`
 * para "sem dados". Tudo o que sai daqui já está em unidades humans.
 */

import type { AgroclimaticSummary, NasaPowerResponse } from "@/types/nasa";

export const SEM_DADOS = -999;

/** Extrai a série diária de um parâmetro, ignorando valores sem dados. */
export function serieDiaria(
  resposta: NasaPowerResponse,
  parametro: keyof NasaPowerResponse["properties"]["parameter"]
): { data: string; valor: number }[] {
  const serie = resposta.properties.parameter[parametro] ?? {};
  return Object.entries(serie)
    .filter(([, valor]) => valor !== SEM_DADOS)
    .map(([data, valor]) => ({ data, valor }));
}

/** Converte `20261112` em `2026-11-12`. */
export function dataIso(compacta: string): string {
  return `${compacta.slice(0, 4)}-${compacta.slice(4, 6)}-${compacta.slice(6, 8)}`;
}

/** Temperatura média do período (°C). */
export function temperaturaMedia(resposta: NasaPowerResponse): number {
  const valores = serieDiaria(resposta, "T2M").map((d) => d.valor);
  if (!valores.length) return 0;
  return valores.reduce((soma, v) => soma + v, 0) / valores.length;
}

/** Temperatura máxima absoluta do período (°C). */
export function temperaturaMaxima(resposta: NasaPowerResponse): number {
  const valores = serieDiaria(resposta, "T2M_MAX").map((d) => d.valor);
  return valores.length ? Math.max(...valores) : 0;
}

/** Temperatura mínima absoluta do período (°C). */
export function temperaturaMinima(resposta: NasaPowerResponse): number {
  const valores = serieDiaria(resposta, "T2M_MIN").map((d) => d.valor);
  return valores.length ? Math.min(...valores) : 0;
}

/** Precipitação acumulada do período (mm). */
export function precipitacaoAcumulada(resposta: NasaPowerResponse): number {
  return serieDiaria(resposta, "PRECTOTCORR").reduce((soma, d) => soma + d.valor, 0);
}

/** Humidade relativa média do ar (%). */
export function humidadeRelativa(resposta: NasaPowerResponse): number {
  const valores = serieDiaria(resposta, "RH2M").map((d) => d.valor);
  if (!valores.length) return 0;
  return valores.reduce((soma, v) => soma + v, 0) / valores.length;
}

/** Radiação solar diária média (MJ/m²/dia). */
export function radiacaoSolar(resposta: NasaPowerResponse): number {
  const valores = serieDiaria(resposta, "ALLSKY_SFC_SW_DWN").map((d) => d.valor);
  if (!valores.length) return 0;
  return valores.reduce((soma, v) => soma + v, 0) / valores.length;
}

/** Converte a resposta da NASA num resumo agroclimático pronto a mostrar. */
export function normalizarPoder(
  resposta: NasaPowerResponse,
  opcoes: {
    humidadeRaiz: number;
    latitude?: number;
    longitude?: number;
  }
): AgroclimaticSummary {
  const [lon, lat] = resposta.geometry.coordinates;

  const precip = precipitacaoAcumulada(resposta);
  const max = temperaturaMaxima(resposta);
  const min = temperaturaMinima(resposta);

  return {
    latitude: opcoes.latitude ?? lat,
    longitude: opcoes.longitude ?? lon,
    averageAnnualRainfallMm: Math.round(precip),
    maxTemperaturePeakC: Math.round(max),
    minTemperaturePeakC: Math.round(min),
    currentRootZoneMoisturePct: Math.round(opcoes.humidadeRaiz * 100),
    droughtRiskLevel:
      precip < 250 ? "extreme" : precip < 500 ? "high" : precip < 900 ? "moderate" : "low",
    lastSatelliteSyncDate: new Date().toISOString().slice(0, 10),
  };
}
