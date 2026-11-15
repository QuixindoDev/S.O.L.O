#!/usr/bin/env python3
import re, shutil, sys
from pathlib import Path

if not Path("src/types/nasa.ts").exists():
    sys.exit("Corra isto na raiz do front-end (onde está a pasta src/).")

def read(p): return Path(p).read_text(encoding="utf-8")

def write(p, s):
    p = Path(p)
    bak = p.with_name(p.name + ".bak")
    if not bak.exists():
        shutil.copy(p, bak)
    p.write_text(s, encoding="utf-8")
    print("OK  ", p)

# ───────────────────────── 1. src/types/nasa.ts ─────────────────────────
TYPES = r'''
export type WeatherCondition = "sun" | "cloud" | "rain";

export interface DailyPoint {
  date: string; // YYYYMMDD
  label: string; // "15/11"
  dayOfWeek: string;
  dayNumber: number;
  tMean: number;
  tMax: number;
  tMin: number;
  rainMm: number;
  humidity: number;
  radiation: number; // MJ/m²/dia
  et0Mm: number;
  condition: WeatherCondition;
}

export interface AgroSummary {
  series: DailyPoint[]; // do mais antigo para o mais recente
  last7: DailyPoint[];
  current: DailyPoint | null;
  lastSatellitePass: string | null; // YYYYMMDD
  rainTotalMm: number;
  et0TotalMm: number;
  /** mm de chuva por mês do ano ("01".."12"), somados na série. */
  rainByMonthOfYear: Record<string, number>;
}
'''
p = "src/types/nasa.ts"
s = read(p)
if "export interface AgroSummary" in s:
    print("SKIP", p, "(já tem AgroSummary)")
else:
    write(p, s.rstrip() + "\n" + TYPES)

# ───────────────────────── 2. src/lib/nasa/client.ts ─────────────────────────
CLIENT_IMPORTS = '''import { et0Hargreaves } from "@/lib/agronomia";
import type { AgroSummary, DailyPoint, WeatherCondition } from "@/types/nasa";

'''

CLIENT_BLOCK = r'''const MISSING = -999;
const WEEKDAYS = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

type PowerJson = {
  properties?: { parameter?: Record<string, Record<string, number>> };
};

const emptySummary = (): AgroSummary => ({
  series: [], last7: [], current: null, lastSatellitePass: null,
  rainTotalMm: 0, et0TotalMm: 0, rainByMonthOfYear: {},
});

const toYmd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
const num = (v?: number) => (v === undefined || v === MISSING ? null : v);
const parseYmd = (s: string) =>
  new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)));
const dayOfYear = (d: Date) =>
  Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86_400_000);

function conditionOf(rainMm: number, radiation: number): WeatherCondition {
  if (rainMm >= 2) return "rain";
  if (radiation > 0 && radiation < 14) return "cloud"; // limiar empírico
  return "sun";
}

export async function getAgroSummary(
  lat: number,
  lon: number,
  days = 30
): Promise<AgroSummary> {
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 86_400_000);

  try {
    const raw = (await fetchNasaPower({
      lat, lon, start: toYmd(start), end: toYmd(end),
    })) as PowerJson;

    const p = raw.properties?.parameter;
    if (!p) return emptySummary();

    const series: DailyPoint[] = [];
    const rainByMonthOfYear: Record<string, number> = {};

    for (const date of Object.keys(p.T2M_MAX ?? {}).sort()) {
      const tMax = num(p.T2M_MAX?.[date]);
      const tMin = num(p.T2M_MIN?.[date]);
      const tMean = num(p.T2M?.[date]);
      const rain = num(p.PRECTOTCORR?.[date]);
      if (tMax === null || tMin === null || tMean === null || rain === null) continue;

      const d = parseYmd(date);
      const radiation = num(p.ALLSKY_SFC_SW_DWN?.[date]) ?? 0;
      series.push({
        date,
        label: `${date.slice(6, 8)}/${date.slice(4, 6)}`,
        dayOfWeek: WEEKDAYS[d.getUTCDay()],
        dayNumber: d.getUTCDate(),
        tMean, tMax, tMin,
        rainMm: rain,
        humidity: num(p.RH2M?.[date]) ?? 0,
        radiation,
        et0Mm: et0Hargreaves(tMean, tMax, tMin, lat, dayOfYear(d)),
        condition: conditionOf(rain, radiation),
      });

      const month = date.slice(4, 6); // "01".."12"
      rainByMonthOfYear[month] = Number(((rainByMonthOfYear[month] ?? 0) + rain).toFixed(1));
    }

    const current = series.at(-1) ?? null;
    return {
      series,
      last7: series.slice(-7),
      current,
      lastSatellitePass: current?.date ?? null,
      rainTotalMm: Number(series.reduce((s, x) => s + x.rainMm, 0).toFixed(1)),
      et0TotalMm: Number(series.reduce((s, x) => s + x.et0Mm, 0).toFixed(1)),
      rainByMonthOfYear,
    };
  } catch {
    return emptySummary();
  }
}
'''

p = "src/lib/nasa/client.ts"
s = read(p)
markers = ["export interface AgroDay", "export interface AgroSummary", "const MISSING = -999;"]
found = [s.index(m) for m in markers if m in s]
base = s[: min(found)] if found else s
base = re.sub(r'^import .*(agronomia|types/nasa).*\n', '', base, flags=re.M)
write(p, CLIENT_IMPORTS + base.strip() + "\n\n" + CLIENT_BLOCK)

# ───────────────────────── 3. src/lib/agronomia.ts ─────────────────────────
ET0 = r'''export function et0Hargreaves(
  tMedia: number,
  tMax: number,
  tMin: number,
  latitude: number,
  diaDoAno = 180
): number {
  const amplitude = Math.max(0, tMax - tMin);
  const ra = radiacaoExtraterrestre(latitude, diaDoAno) * 0.408; // mm/dia equivalente
  const et0 = 0.0023 * ra * Math.sqrt(amplitude) * (tMedia + 17.8);
  return Math.max(0, Number(et0.toFixed(2)));
}

function radiacaoExtraterrestre(latitudeGraus: number, diaDoAno: number): number {
  const phi = latitudeGraus * (Math.PI / 180);
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * diaDoAno) / 365);
  const delta = 0.409 * Math.sin((2 * Math.PI * diaDoAno) / 365 - 1.39);
  const ws = Math.acos(Math.min(1, Math.max(-1, -Math.tan(phi) * Math.tan(delta))));
  const gsc = 0.082; // MJ m⁻² min⁻¹
  return (
    ((24 * 60) / Math.PI) * gsc * dr *
    (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws))
  ); // MJ m⁻² dia⁻¹
}
'''

MOISTURE = r'''export interface SoilMoisture {
  status: EstadoHumidade;
  statusLabel: string;
  rootZonePct: number; // 0–100
  surfacePct: number; // 0–100
  soilTemperatureC: number;
  daysSinceRain: number;
  rainTotalMm: number; // últimos 7 dias
  advice: string;
}

const STATUS_LABEL: Record<EstadoHumidade, string> = {
  seco: "Solo seco",
  precisa_agua: "Precisa de água",
  ideal: "Humidade ideal",
  encharcado: "Solo encharcado",
};

/** Balanço hídrico de duas camadas (superfície + zona radicular), dia a dia. */
export function estimateSoilMoisture(
  summary: AgroSummary,
  soil: SoilTextureType
): SoilMoisture {
  const rootCap = 100 * coeficienteBolo(soil); // franco = 75 mm
  const surfCap = 15 * coeficienteBolo(soil);
  let root = rootCap * 0.5;
  let surf = surfCap * 0.5;

  for (const d of summary.series) {
    surf += d.rainMm - d.et0Mm * 0.9; // a superfície seca mais depressa
    if (surf > surfCap) {
      root += surf - surfCap; // o excesso infiltra
      surf = surfCap;
    }
    surf = Math.max(0, surf);
    root = Math.min(rootCap, Math.max(0, root - etc(d.et0Mm, 0.7)));
  }

  const rootZonePct = Math.round((root / rootCap) * 100);
  const surfacePct = Math.round((surf / surfCap) * 100);
  const status = classificarHumidade(rootZonePct);

  const last7 = summary.series.slice(-7);
  const rainTotalMm = Number(last7.reduce((s, d) => s + d.rainMm, 0).toFixed(1));

  let daysSinceRain = 0;
  for (let i = summary.series.length - 1; i >= 0; i--) {
    if (summary.series[i].rainMm >= 1) break;
    daysSinceRain++;
  }

  const lastTemps = summary.series.slice(-3);
  const soilTemperatureC = lastTemps.length
    ? Math.round(lastTemps.reduce((s, d) => s + d.tMean, 0) / lastTemps.length)
    : 0;

  let advice = "O solo está bem. Não precisa de regar.";
  if (status === "seco" || status === "precisa_agua") {
    const faltaMm = Math.max(0, rootCap * 0.65 - root) / 0.7;
    const baldes = litrosPorBalde(faltaMm, 10); // canteiro de 10 m²
    advice = `Regue de manhã cedo ou ao fim da tarde: cerca de ${baldes} ${
      baldes === 1 ? "balde" : "baldes"
    } de 20 L por cada 10 m².`;
  } else if (status === "encharcado") {
    advice = "O solo está encharcado. Espere antes de regar e deixe a água escoar.";
  }

  return {
    status, statusLabel: STATUS_LABEL[status],
    rootZonePct, surfacePct, soilTemperatureC, daysSinceRain, rainTotalMm, advice,
  };
}
'''

p = "src/lib/agronomia.ts"
s = read(p)

# imports
s = s.replace('import type { AgroSummary } from "@/lib/nasa/client";',
              'import type { AgroSummary } from "@/types/nasa";')
if 'from "@/types/nasa"' not in s:
    s = s.replace('import type { SoilTextureType } from "@/types/agronomy";',
                  'import type { SoilTextureType } from "@/types/agronomy";\nimport type { AgroSummary } from "@/types/nasa";', 1)

# et0Hargreaves corrigido
if "radiacaoExtraterrestre" not in s:
    s, n = re.subn(r'export function et0Hargreaves\([\s\S]*?\n}\n', lambda m: ET0, s, count=1)
    if n == 0:
        print("AVISO: não encontrei et0Hargreaves para substituir")

# remover versão antiga de estimateSoilMoisture e voltar a acrescentar
starts = [s.index(m) for m in ("export interface MoistureEstimate", "export interface SoilMoisture") if m in s]
if starts:
    a = min(starts)
    f = s.index("export function estimateSoilMoisture", a)
    e = s.index("\n}", f) + 2
    s = s[:a].rstrip() + "\n\n" + s[e:].lstrip()
write(p, s.rstrip() + "\n\n" + MOISTURE)

# ───────────────────────── 4. src/hooks/useSimulator.ts ─────────────────────────
p = "src/hooks/useSimulator.ts"
s = read(p)
if "summary?: AgroSummary" in s:
    print("SKIP", p, "(já alterado)")
else:
    s = s.replace('} from "@/types/agronomy";',
                  '} from "@/types/agronomy";\nimport type { AgroSummary } from "@/types/nasa";', 1)
    s = s.replace("export function useSimulator(",
                  "export type RotationSimulation = SimulationResult;\n\nexport function useSimulator(", 1)
    s = s.replace("  selection: RotationSequenceSelection\n): SimulationResult {",
                  "  selection: RotationSequenceSelection,\n  summary?: AgroSummary | null\n): RotationSimulation {", 1)
    s = s.replace("}, [biome, soil, priority, selection]);",
                  "}, [biome, soil, priority, selection, summary]);", 1)
    write(p, s)

# ───────────────────────── 5. inicio/page.tsx: "encharcado" não é "seco" ─────────────────────────
p = "src/app/(app)/inicio/page.tsx"
s = read(p)
old = 'const dry = moisture.status !== "ideal";'
new = 'const dry = moisture.status === "seco" || moisture.status === "precisa_agua";'
if old in s:
    write(p, s.replace(old, new))
else:
    print("SKIP", p)

print("\nFeito. Agora: npm run build")
