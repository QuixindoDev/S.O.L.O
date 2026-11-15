import type {
  AgroSummary,
  DailyPoint,
  NasaPowerResponse,
} from "@/types/nasa";

/** A NASA POWER usa -999 (ou -9999) como sentinela de "sem medição". */
const MISSING = -900;

function isValid(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > MISSING;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

/** "20260115" → { label: "15 de jan", dayOfWeek: "Qui", dayNumber: "15" } */
function formatDate(iso: string) {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(4, 6)) - 1;
  const day = Number(iso.slice(6, 8));
  const date = new Date(Date.UTC(year, month, day));

  return {
    label: `${day} de ${MONTHS[month].toLowerCase()}`,
    dayOfWeek: WEEKDAYS[date.getUTCDay()],
    dayNumber: String(day),
    monthIndex: month,
    monthKey: iso.slice(0, 6),
  };
}

function conditionFor(rainMm: number, humidity: number): DailyPoint["condition"] {
  if (rainMm >= 2) return "rain";
  if (rainMm > 0 || humidity >= 80) return "cloud";
  return "sun";
}

/**
 * Converte a resposta crua da NASA POWER num resumo agroclimático
 * pronto a mostrar. Descarta dias sem medição válida.
 */
export function normalizePower(response: NasaPowerResponse): AgroSummary {
  const params = response?.properties?.parameter ?? ({} as never);
  const coordinates = response?.geometry?.coordinates ?? [0, 0, 0];

  const dates = Object.keys(params.T2M ?? {}).sort();

  const points: DailyPoint[] = [];
  for (const date of dates) {
    const tMean = params.T2M?.[date];
    const tMax = params.T2M_MAX?.[date];
    const tMin = params.T2M_MIN?.[date];
    const rain = params.PRECTOTCORR?.[date];
    const humidity = params.RH2M?.[date];
    const radiation = params.ALLSKY_SFC_SW_DWN?.[date];
    const wind = params.WS2M?.[date];

    if (!isValid(tMean) || !isValid(tMax) || !isValid(tMin)) continue;

    const rainMm = isValid(rain) ? Math.max(0, rain) : 0;
    const rh = isValid(humidity) ? humidity : 0;
    const rad = isValid(radiation) ? radiation : 0;
    const windSpeed = isValid(wind) ? wind : 0;

    const { label, dayOfWeek, dayNumber, monthKey } = formatDate(date);

    points.push({
      date,
      label,
      dayOfWeek,
      dayNumber,
      tMax,
      tMin,
      tMean,
      rainMm,
      humidity: rh,
      radiation: rad,
      windSpeed,
      condition: conditionFor(rainMm, rh),
    });
  }

  const monthlyRainMm: Record<string, number> = {};
  let annualRainMm = 0;
  for (const p of points) {
    const key = p.date.slice(0, 6);
    monthlyRainMm[key] = (monthlyRainMm[key] ?? 0) + p.rainMm;
    annualRainMm += p.rainMm;
  }

  const avg = (list: number[]) =>
    list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;

  // Dias seguidos sem chuva relevante (contando de trás para a frente).
  let daysSinceRain = 0;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].rainMm >= 2) break;
    daysSinceRain++;
  }

  return {
    latitude: coordinates[1] ?? 0,
    longitude: coordinates[0] ?? 0,
    elevationM: coordinates[2] ?? 0,
    current: points.length ? points[points.length - 1] : null,
    last7: points.slice(-7).reverse(),
    series: points,
    monthlyRainMm,
    annualRainMm: Math.round(annualRainMm),
    avgTMax: Math.round(avg(points.map((p) => p.tMax))),
    avgTMin: Math.round(avg(points.map((p) => p.tMin))),
    avgHumidity: Math.round(avg(points.map((p) => p.humidity))),
    lastSatellitePass: points.length ? points[points.length - 1].date : null,
    daysSinceRain,
  };
}
