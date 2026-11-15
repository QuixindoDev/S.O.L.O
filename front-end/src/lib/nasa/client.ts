import { normalizePower } from "./normalize";
import type { AgroSummary, NasaPowerResponse } from "@/types/nasa";
import { api } from "@/lib/api/endpoints";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * Resumo de reserva quando o back-end (ou a NASA) não responde.
 * A aplicação tem de funcionar mesmo sem rede — é um requisito
 * do público-alvo (pessoas no campo, com sinal fraco).
 */
export function fallbackSummary(
  latitude: number,
  longitude: number,
): AgroSummary {
  return {
    latitude,
    longitude,
    elevationM: 0,
    current: null,
    last7: [],
    series: [],
    monthlyRainMm: {},
    rainByMonthOfYear: {},
    annualRainMm: 0,
    avgTMax: 28,
    avgTMin: 19,
    avgHumidity: 62,
    lastSatellitePass: null,
    daysSinceRain: 0,
  };
}

/**
 * Busca a série diária da NASA POWER **no back-end** e normaliza.
 *
 * Feito no servidor por três motivos:
 *  1. O HTML já chega com os dados — sem ecrã em branco no 3G rural.
 *  2. O back-end guarda a resposta em cache durante 24 h, poupando
 *     o telemóvel da Dona Maria (e a NASA).
 *  3. Se a NASA estiver em baixo, a aplicação não quebra.
 */
export async function getAgroSummary(
  latitude: number,
  longitude: number,
  windowDays = 90,
): Promise<AgroSummary> {
  const start = isoDaysAgo(windowDays);
  const end = isoDaysAgo(0);

  try {
    const json = await api.nasa.power(
      { lat: latitude, lon: longitude, start, end },
      { revalidate: 86400, timeoutMs: 25_000 },
    );

    return normalizePower(json as NasaPowerResponse);
  } catch (error) {
    console.error("[nasa] falha ao buscar POWER no back-end:", error);
    return fallbackSummary(latitude, longitude);
  }
}
