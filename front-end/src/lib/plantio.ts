/**
 * Calendário de plantio — dados partilhados pelos ecrãs.
 *
 * O calendário é um Gantt: 12 meses em colunas e uma linha por
 * ciclo da rotação. Tudo o que é "decore" (cores, tarefas, meses)
 * vive aqui para o ecrã e a biblioteca falarem a mesma língua.
 */

import type { CropProfile, SoilTextureType } from "@/types/agronomy";
import type { AgroSummary } from "@/types/nasa";
import {
  CROP_KC,
  SOIL_RETENTION,
  effectiveRainfall,
  etoDailyByMonthOfYear,
} from "@/lib/rotacao";
import cropsDatabase from "@/data/crops.json";

const crops = cropsDatabase as CropProfile[];

/**
 * Um plantio no calendário: uma cultura em alguns meses do ano.
 *
 * É esta estrutura que a Dona Maria edita (toca num bloco para
 * retirar, toca num vazio para semear) e que depois vai para o banco.
 */
export interface Planting {
  id: string;
  cropId: string;
  /** Ciclo da rotação a que pertence (0 = safra principal…). */
  ciclo: number;
  /** Meses (0-11) em que a cultura está no chão. */
  meses: number[];
}

/** Balanço hídrico de um plantio — o que a NASA mediu vs. o que a planta precisa. */
export interface PlantingBalance {
  plantingId: string;
  cropId: string;
  /** ETc do plantio (mm). */
  demandMm: number;
  /** Chuva efectiva nos meses do plantio (mm). */
  rainMm: number;
  /** Chuva − demanda. Negativo = falta água. */
  balanceMm: number;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Plantios por omissão: 3 ciclos de 4 meses, como no calendário da NASA. */
export function defaultPlantings(cropIds: string[]): Planting[] {
  return cropIds.map((cropId, index) => ({
    id: `plantio-${index}-${cropId}`,
    cropId,
    ciclo: index,
    meses: cycleMonths(index),
  }));
}

/** Meses (0-11) que cada ciclo ocupa na safra. */
export function cycleMonths(index: number): number[] {
  if (index === 0) return [0, 1, 2, 3];
  if (index === 1) return [4, 5, 6, 7];
  return [8, 9, 10, 11];
}

/**
 * Balanço hídrico de cada plantio, com a chuva e a radiação reais
 * da NASA POWER.
 *
 * Mesma fórmula do ecrã Rotação de Culturas (ETc = ETo × Kc × dias),
 * mas agora os meses são os que a pessoa escolheu no calendário.
 */
export function plantingWaterBalance(
  plantings: Planting[],
  summary: AgroSummary,
  soil: SoilTextureType,
  etoForPoint: (point: AgroSummary["series"][number]) => number,
): PlantingBalance[] {
  const etoDaily = etoDailyByMonthOfYear(summary, etoForPoint);
  const retention = SOIL_RETENTION[soil] ?? 0.75;

  return plantings.map((planting) => {
    const crop = cropById(planting.cropId);
    const months = [...planting.meses].sort((a, b) => a - b);
    const totalDays = months.reduce(
      (sum, month) => sum + (DAYS_IN_MONTH[month] ?? 30),
      0,
    );
    const share = Math.min(1, (crop?.typicalCycleDays ?? 90) / (totalDays || 1));

    const etoCycle = months.reduce(
      (sum, month) => sum + (etoDaily[MONTH_KEYS[month]] ?? 0) * (DAYS_IN_MONTH[month] ?? 30),
      0,
    );
    const rainCycle = months.reduce(
      (sum, month) =>
        sum + effectiveRainfall(summary.rainByMonthOfYear[MONTH_KEYS[month]] ?? 0),
      0,
    );

    const kc = CROP_KC[planting.cropId] ?? 1;
    const demandMm = Math.round(etoCycle * share * kc);
    const rainMm = Math.round(rainCycle * share * retention);

    return {
      plantingId: planting.id,
      cropId: planting.cropId,
      demandMm,
      rainMm,
      balanceMm: rainMm - demandMm,
    };
  });
}

/** Chave do mês no formato da NASA ("01"…"12"). */
const MONTH_KEYS = Array.from(
  { length: 12 },
  (_, index) => String(index + 1).padStart(2, "0"),
);

/** Cultura pelo id — a base de dados é a fonte de verdade. */
export function cropById(cropId: string): CropProfile | undefined {
  return crops.find((c) => c.id === cropId);
}

/**
 * Plantios para uma rotação, preservando as edições do calendário.
 *
 * Quando a Dona Maria volta a guardar a rotação no ecrã Rotação de
 * Culturas, os meses que ela já tinha mexido no calendário mantêm-se
 * — a menos que a cultura tenha mudado, aí o plantio é refeito.
 */
export function plantingsForSelection(
  selection: {
    cycle1CropId: string;
    cycle2CropId: string;
    cycle3CropId: string;
  },
  savedPlantings?: Planting[],
): Planting[] {
  const cropsByCycle = [
    selection.cycle1CropId,
    selection.cycle2CropId,
    selection.cycle3CropId,
  ];

  return cropsByCycle.map((cropId, ciclo) => {
    const guardado = savedPlantings?.find(
      (p) => p.cropId === cropId && p.ciclo === ciclo && p.meses.length > 0,
    );

    return (
      guardado ?? {
        id: `plantio-${ciclo}-${cropId}`,
        cropId,
        ciclo,
        meses: cycleMonths(ciclo),
      }
    );
  });
}

/** Onde a rotação e o calendário ficam guardados no dispositivo. */
export const STORAGE_KEY = "solo.rotacao.guarda";

export interface SavedRotation {
  savedAt?: string;
  planId?: string;
  score?: number;
  selection?: {
    cycle1CropId: string;
    cycle2CropId: string;
    cycle3CropId: string;
  };
  /** Plantios editados no calendário — é isto que vai para o banco. */
  plantings?: Planting[];
}

/** Lê o que está guardado (rotação + calendário). */
export function loadSavedRotation(): SavedRotation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedRotation;
  } catch {
    return null;
  }
}

/** Guarda a rotação e o calendário, sem perder o que já lá estava. */
export function saveRotation(data: SavedRotation): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadSavedRotation() ?? {};
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, ...data, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Sem espaço no dispositivo — a app continua a funcionar.
  }
}


/** Meses em abreviatura — cabem 12 colunas no ecrã do telemóvel. */
export const MONTHS_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

/** Meses por extenso — nos textos ("em Janeiro"). */
export const MONTHS_LONG = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/**
 * Cor de cada cultura no calendário.
 *
 * Por família: cereais à verde, leguminosas a âmbar (o adubo
 * natural), plantas de cobertura a azul (a água) e oleaginosas
 * a terracota.
 */
export const CROP_COLORS: Record<string, string> = {
  milho: "#006B2C",
  sorgo: "#006B2C",
  girassol: "#006B2C",
  soja: "#B26A00",
  feijao_caupi: "#B26A00",
  feijao_guandu: "#B26A00",
  braquiaria: "#2F80C0",
  crotalaria: "#2F80C0",
  gergelim: "#C2410C",
  pousio_desnudo: "#6E7B6C",
};

/** Cor por omissão quando a cultura não está no mapa. */
export const DEFAULT_CROP_COLOR = "#006B2C";

export function cropColor(cropId: string): string {
  return CROP_COLORS[cropId] ?? DEFAULT_CROP_COLOR;
}

/** Período curto do plantio, como se lê no calendário ("Jan – Mar"). */
export function monthsShortPeriod(meses: number[]): string {
  if (meses.length === 0) return "—";
  const sorted = [...meses].sort((a, b) => a - b);
  if (sorted.length === 1) return MONTHS_SHORT[sorted[0]];
  return `${MONTHS_SHORT[sorted[0]]} – ${MONTHS_SHORT[sorted[sorted.length - 1]]}`;
}

/** Período curto do ciclo, como se lê no calendário ("Jan – Abr"). */
export function cycleShortPeriod(index: number): string {
  const months = cycleMonths(index);
  const first = MONTHS_SHORT[months[0]];
  const last = MONTHS_SHORT[months[months.length - 1]];
  return `${first} – ${last}`;
}

/** "Setembro a Dezembro" — a frase completa do período. */
export function cycleLongPeriod(index: number): string {
  const months = cycleMonths(index);
  return `${MONTHS_LONG[months[0]]} a ${MONTHS_LONG[months[months.length - 1]]}`;
}

/** O que fazer com esta cultura — a tarefa que entra no calendário. */
export interface PlantingTask {
  nome: string;
  descricao: string;
  /** Mês em que a tarefa acontece. */
  mes: number;
}

export const CROP_TASKS: Record<string, PlantingTask> = {
  milho: {
    nome: "Preparar o terreno para o Milho",
    descricao:
      "Cavar 20 cm e adubar com esterco antes da primeira chuva boa.",
    mes: 0,
  },
  feijao_caupi: {
    nome: "Comprar sementes de Feijão-Caupi",
    descricao:
      "Feira livre da cidade — semear só depois de o Milho estar colhido.",
    mes: 3,
  },
  braquiaria: {
    nome: "Semear a Braquiária",
    descricao:
      "Espalha as sementes e deixa crescer — é a cobertura que protege a terra do sol.",
    mes: 8,
  },
  crotalaria: {
    nome: "Semear a Crotalária",
    descricao:
      "Espalha logo depois da ceifa — é o adubo verde que vai nutrir a terra.",
    mes: 8,
  },
  feijao_guandu: {
    nome: "Semear o Feijão-Guandu",
    descricao:
      "Fica para o fim do ano: é a forragem que o gado come na seca.",
    mes: 9,
  },
  soja: {
    nome: "Comprar sementes de Soja",
    descricao:
      "Feira livre da cidade — a soja fixa azoto e enche a tua horta de folha.",
    mes: 3,
  },
  gergelim: {
    nome: "Semear o Gergelim",
    descricao:
      "Espalha logo que o Milho sai da terra — é a segunda colheita do ano.",
    mes: 5,
  },
  sorgo: {
    nome: "Semear o Sorgo",
    descricao:
      "Depois do Milho, para aproveitar a humidade que ficou na terra.",
    mes: 5,
  },
  girassol: {
    nome: "Semear o Girassol",
    descricao:
      "Nas bordas do canteiro — as flores também servem de alimento para as abelhas.",
    mes: 4,
  },
  pousio_desnudo: {
    nome: "Semear uma planta de cobertura",
    descricao:
      "Terra nua perde água e queima ao sol. Troca por Braquiária ou Crotalária.",
    mes: 8,
  },
};

/** Tarefa por omissão, para culturas que ainda não tenham texto próprio. */
export function taskForCrop(crop: CropProfile): PlantingTask {
  return (
    CROP_TASKS[crop.id] ?? {
      nome: `Semear ${crop.name}`,
      descricao: crop.description,
      mes: cycleMonths(crop.recommendedSeason === "main_rainy" ? 0 : 2)[0],
    }
  );
}
