import { normalizePower } from "./normalize";
import type { AgroSummary, NasaPowerResponse } from "@/types/nasa";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

const PARAMETERS =
  "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN";

/**
 * Resumo de reserva quando a NASA não responde.
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
    monthlyRainMm: {},
    annualRainMm: 0,
    avgTMax: 28,
    avgTMin: 19,
    avgHumidity: 62,
    lastSatellitePass: null,
    daysSinceRain: 0,
  };
}

/**
 * Busca a série diária da NASA POWER no servidor e normaliza.
 *
 * Feito no servidor por três motivos:
 *  1. O HTML já chega com os dados — sem ecrã em branco no 3G rural.
 *  2. `revalidate: 86400` guarda a resposta na edge durante 24h,
 *     poupando o telemóvel da Dona Maria.
 *  3. Se a NASA estiver em baixo, a aplicação não quebra.
 */
export async function getAgroSummary(
  latitude: number,
  longitude: number,
  windowDays = 90,
): Promise<AgroSummary> {
  const start = isoDaysAgo(windowDays);
  const end = isoDaysAgo(0);

  const url =
    `https://power.larc.nasa.gov/api/temporal/daily/point` +
    `?parameters=${PARAMETERS}&community=AG` +
    `&longitude=${longitude}&latitude=${latitude}` +
    `&start=${start}&end=${end}&format=JSON`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });

    if (!res.ok) {
      throw new Error(`NASA POWER respondeu ${res.status}`);
    }

    const json = (await res.json()) as NasaPowerResponse;
    return normalizePower(json);
  } catch (error) {
    console.error("[nasa] falha ao buscar POWER:", error);
    return fallbackSummary(latitude, longitude);
  }
}
