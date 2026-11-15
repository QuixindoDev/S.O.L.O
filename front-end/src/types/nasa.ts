/**
 * TypeScript contracts for NASA Earth Observation Datasets
 * S.O.L.O. - Smart Observation Land Optimization
 */

export interface NasaPowerParameters {
  T2M: Record<string, number>;           // Daily average temperature at 2 Meters (°C)
  T2M_MAX: Record<string, number>;       // Daily maximum temperature at 2 Meters (°C)
  T2M_MIN: Record<string, number>;       // Daily minimum temperature at 2 Meters (°C)
  PRECTOTCORR: Record<string, number>;   // Daily corrected precipitation (mm/day)
  RH2M: Record<string, number>;          // Relative humidity at 2 Meters (%)
  ALLSKY_SFC_SW_DWN: Record<string, number>; // All-sky surface downward shortwave radiation (MJ/m²/day)
  WS2M?: Record<string, number>;         // Wind speed at 2 Meters (m/s)
}

export interface NasaPowerResponse {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number, number]; // [lon, lat, elevation]
  };
  properties: {
    parameter: NasaPowerParameters;
  };
  header: {
    title: string;
    api_version: string;
    start: string;
    end: string;
  };
  messages: string[];
}

export interface SmapSoilMoistureRecord {
  date: string;
  surfaceMoisture: number; // 0-5 cm volumetric water content (cm³/cm³)
  rootZoneMoisture: number; // 0-100 cm volumetric water content (cm³/cm³)
  anomalyScore: number;     // Standardized deviation from 10-year climatology
  status: "severe_deficit" | "deficit" | "optimal" | "saturated";
}

export interface AgroclimaticSummary {
  latitude: number;
  longitude: number;
  averageAnnualRainfallMm: number;
  maxTemperaturePeakC: number;
  minTemperaturePeakC: number;
  currentRootZoneMoisturePct: number;
  droughtRiskLevel: "low" | "moderate" | "high" | "extreme";
  lastSatelliteSyncDate: string;
}

/** Um dia de observação normalizado, pronto a ser mostrado. */
export interface DailyPoint {
  /** AAAAMMDD tal como vem da NASA POWER */
  date: string;
  /** Data já formatada em pt-BR para mostrar à pessoa */
  label: string;
  dayOfWeek: string;
  dayNumber: string;
  tMax: number;
  tMin: number;
  tMean: number;
  rainMm: number;
  humidity: number;
  /** Radiação solar MJ/m²/dia */
  radiation: number;
  /** Velocidade do vento a 2 m (m/s) */
  windSpeed: number;
  /** Condição simplificada para escolher o ícone */
  condition: "sun" | "cloud" | "rain";
}

/** Resumo agroclimático pronto a consumir pelos ecrãs. */
export interface AgroSummary {
  latitude: number;
  longitude: number;
  elevationM: number;
  /** Último dia com dados válidos */
  current: DailyPoint | null;
  /** Últimos 7 dias com dados válidos (do mais recente para o mais antigo) */
  last7: DailyPoint[];
  /** Série completa com dados válidos (do mais antigo para o mais recente) */
  series: DailyPoint[];
  /** Chuva acumulada por mês (mm) */
  monthlyRainMm: Record<string, number>;
  annualRainMm: number;
  avgTMax: number;
  avgTMin: number;
  avgHumidity: number;
  /** Data da última passagem do satélite com dados */
  lastSatellitePass: string | null;
  /** Número de dias seguidos sem chuva relevante */
  daysSinceRain: number;
}
