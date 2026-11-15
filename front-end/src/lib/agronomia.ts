import type { AgroSummary, DailyPoint } from "@/types/nasa";
import type { SoilTextureType } from "@/types/agronomy";

/**
 * Modelo agronómico — balanço hídrico do solo.
 *
 * Não substitui o SMAP (que dá a humidade do solo medida por satélite),
 * mas dá uma **estimativa fundamentada** a partir de chuva, radiação,
 * vento e humidade do ar reais da NASA POWER. Serve para:
 *   - dizer à Dona Maria se a terra está seca ou húmida;
 *   - decidir se vale a pena regar.
 *
 * Método:
 *   1. ETo (evapotranspiração de referência) — Penman-Monteith
 *      (FAO-56, eq. 6) com a radiação solar, o vento e a humidade
 *      do ar medidos pela NASA.
 *   2. Balanço de um balde (bucket) com 2 camadas:
 *      superficial (5 cm) e zona radicular (30-40 cm).
 *   3. Humidade final → % da capacidade de campo, por textura de solo.
 *
 * Referência: FAO Irrigation & Drainage Paper 56 (Allen et al., 1998).
 */

/** Constante solar (MJ m⁻² min⁻¹). */
const SOLAR_CONSTANT = 0.082;
/** Altitude média da região (m) — usada na pressão atmosférica. */
const ALTITUDE_M = 245;
/** Fluxo de calor do solo (MJ/m²/dia) — desprezível em Daily. */
const SOIL_HEAT_FLUX = 0;

/** Capacidade de campo, ponto de murcha e profundidade das raízes. */
const SOIL_PROPERTIES: Record<
  SoilTextureType,
  { fieldCapacity: number; wiltingPoint: number; rootDepthMm: number }
> = {
  arenoso: { fieldCapacity: 0.13, wiltingPoint: 0.05, rootDepthMm: 300 },
  franco: { fieldCapacity: 0.22, wiltingPoint: 0.1, rootDepthMm: 400 },
  argiloso: { fieldCapacity: 0.3, wiltingPoint: 0.15, rootDepthMm: 400 },
};

/** Profundidade da camada superficial (mm). */
const SURFACE_DEPTH_MM = 50;
/** Coeficiente de cultura — uma horta bem regada. */
const CROP_COEFFICIENT = 0.8;
/** Fração da ETo que evapora da superfície do solo sem cobertura. */
const SOIL_EVAPORATION_FACTOR = 0.6;
/** Humidade inicial do solo no início do balanço (% da capacidade de campo). */
const INITIAL_FILL = 0.55;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Pressão atmosférica (kPa) a partir da altitude. */
export function atmosphericPressure(altitudeM: number): number {
  return 101.3 * Math.pow((293 - 0.0065 * altitudeM) / 293, 5.26);
}

/** Constante psicrométrica (kPa/°C). */
export function psychrometricConstant(pressureKpa: number): number {
  return 0.000665 * pressureKpa;
}

/** Pressão de vapor de saturação (kPa) — equação de Tetens. */
export function saturationVapourPressure(tempC: number): number {
  return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

/** Inclinação da curva de pressão de vapor (kPa/°C) — FAO-56 eq. 13. */
export function vapourPressureSlope(tempC: number): number {
  return (
    (4098 * saturationVapourPressure(tempC)) /
    Math.pow(tempC + 237.3, 2)
  );
}

/**
 * Radiação extraterrestrial diária (MJ/m²/dia) — FAO-56, equação 21.
 */
export function extraterrestrialRadiation(
  latitude: number,
  dayOfYear: number,
): number {
  const phi = toRadians(latitude);
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365);
  const delta = 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);
  const omegaS = Math.acos(
    Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(delta))),
  );

  return (
    ((24 * 60) / Math.PI) *
    SOLAR_CONSTANT *
    dr *
    (omegaS * Math.sin(phi) * Math.sin(delta) +
      Math.cos(phi) * Math.cos(delta) * Math.sin(omegaS))
  );
}

/**
 * Evapotranspiração de referência — Penman-Monteith (FAO-56, eq. 6).
 * Devolve mm/dia. Usa a radiação, o vento e a humidade reais da NASA.
 */
export function referenceEvapotranspiration(
  point: DailyPoint,
  latitude: number,
  altitudeM: number = ALTITUDE_M,
): number {
  const pressure = atmosphericPressure(altitudeM);
  const gamma = psychrometricConstant(pressure);
  const delta = vapourPressureSlope(point.tMean);

  // Pressão de vapor de saturação média e actual
  const es =
    (saturationVapourPressure(point.tMax) +
      saturationVapourPressure(point.tMin)) /
    2;
  const ea = es * (Math.max(0, Math.min(100, point.humidity)) / 100);

  // Radiação solar: a NASA dá MJ/m²/dia; a equação usa MJ/m²/dia também.
  const rs = point.radiation > 0 ? point.radiation : extraterrestrialRadiation(latitude, dayOfYearOf(point.date));

  // Vento a 2 m (m/s); mínimo de 0.5 m/s segundo o FAO-56
  const u2 = Math.max(0.5, point.windSpeed);

  const numerator =
    0.408 * delta * (rs - SOIL_HEAT_FLUX) +
    gamma * ((900 / (point.tMean + 273)) * u2 * (es - ea));
  const denominator = delta + gamma * (1 + 0.34 * u2);

  const eto = numerator / denominator;

  return Math.max(0, Math.min(20, eto));
}

function dayOfYearOf(date: string): number {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6));
  const day = Number(date.slice(6, 8));
  const d = new Date(Date.UTC(year, month - 1, day));
  const start = Date.UTC(year, 0, 0);
  return Math.round((d.getTime() - start) / 86400000);
}

export interface SoilMoisture {
  /** 0-100 — % da capacidade de campo na zona radicular */
  rootZonePct: number;
  /** 0-100 — % da capacidade de campo na superfície */
  surfacePct: number;
  /** Temperatura estimada do solo (°C) — o solo é mais frio que o ar */
  soilTemperatureC: number;
  /** Dias seguidos sem chuva relevante */
  daysSinceRain: number;
  /** Chuva acumulada no período (mm) */
  rainTotalMm: number;
  /** Evapotranspiração acumulada no período (mm) */
  evapotranspirationMm: number;
  /** Estado em linguagem simples */
  status: "ideal" | "atencao" | "seco";
  statusLabel: string;
  /** Texto de advice para a Dona Maria */
  advice: string;
}

/**
 * Corre o balanço hídrico sobre toda a série disponível e devolve a
 * humidade actual do solo estimada.
 */
export function estimateSoilMoisture(
  summary: AgroSummary,
  soil: SoilTextureType = "argiloso",
): SoilMoisture {
  const props = SOIL_PROPERTIES[soil];
  const series = summary.series.length
    ? summary.series
    : summary.last7.slice().reverse();

  let root = props.fieldCapacity * INITIAL_FILL;
  let surface = props.fieldCapacity * INITIAL_FILL;
  let rainTotal = 0;
  let etTotal = 0;

  for (const day of series) {
    const eto = referenceEvapotranspiration(day, summary.latitude);
    etTotal += eto;

    const infiltration = day.rainMm;
    rainTotal += day.rainMm;

    root += infiltration / props.rootDepthMm;
    surface += infiltration / SURFACE_DEPTH_MM;

    // Coeficiente de stress hídrico (FAO-56, eq. 66): quando o solo seca,
    // a planta fecha os estomas e transpira menos. Sem isto o solo
    // entraria em colapso até ao ponto de murcha.
    const ks = Math.max(
      0,
      Math.min(1, (root - props.wiltingPoint) / (props.fieldCapacity - props.wiltingPoint)),
    );
    const surfaceKs = Math.max(
      0,
      Math.min(1, (surface - props.wiltingPoint) / (props.fieldCapacity - props.wiltingPoint)),
    );

    root -= (eto * CROP_COEFFICIENT * ks) / props.rootDepthMm;
    surface -=
      (eto * SOIL_EVAPORATION_FACTOR * surfaceKs) / SURFACE_DEPTH_MM;

    // Drenagem: o que está acima da capacidade de campo escorre
    root = Math.min(root, props.fieldCapacity);
    surface = Math.min(surface, props.fieldCapacity);

    // Nunca abaixo do ponto de murcha
    root = Math.max(root, props.wiltingPoint);
    surface = Math.max(surface, props.wiltingPoint);
  }

  const toPct = (value: number) =>
    Math.round(
      ((value - props.wiltingPoint) /
        (props.fieldCapacity - props.wiltingPoint)) *
        100,
    );

  const rootZonePct = Math.max(0, Math.min(100, toPct(root)));
  const surfacePct = Math.max(0, Math.min(100, toPct(surface)));

  const current = summary.current;
  const soilTemperatureC = current ? Math.round(current.tMean - 3) : 24;

  const status: SoilMoisture["status"] =
    rootZonePct >= 60 ? "ideal" : rootZonePct >= 35 ? "atencao" : "seco";

  const statusLabel =
    status === "ideal"
      ? "Ideal"
      : status === "atencao"
        ? "Precisa de água"
        : "Seco, cuidado";

  const advice =
    status === "ideal"
      ? "A terra está úmida na medida certa. Boa de plantar e afofar."
      : status === "atencao"
        ? "O solo está a secar. Regue bem cedo de manhã, antes do sol."
        : "O solo está muito seco. Convém regar antes de plantar ou adubar.";

  return {
    rootZonePct,
    surfacePct,
    soilTemperatureC,
    daysSinceRain: summary.daysSinceRain,
    rainTotalMm: Math.round(rainTotal),
    evapotranspirationMm: Math.round(etTotal),
    status,
    statusLabel,
    advice,
  };
}
