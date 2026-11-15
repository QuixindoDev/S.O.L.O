import type { CropProfile, FarmerPriority } from "@/types/agronomy";
import type { AgroSummary } from "@/types/nasa";

/**
 * Motor de simulação de rotação de culturas — ligado aos dados reais
 * da NASA POWER.
 *
 * A ideia: para cada cultura escolhida calculamos a **demanda hídrica**
 * (ETc = ETo × Kc × dias do ciclo) usando a ETo real medida pela NASA,
 * e comparamos com a **chuva efectiva** que caiu nos mesmos meses
 * (método USDA-SCS), ajustada pela capacidade de retenção do solo.
 *
 * A diferença é o balanço hídrico da rotação — é isso que diz à
 * Dona Maria se a safra vai falhar por falta de água.
 */

/** Coeficiente de cultura (Kc) — quanto a cultura transpira face à ETo. */
export const CROP_KC: Record<string, number> = {
  milho: 1.2,
  soja: 1.05,
  feijao_caupi: 0.9,
  sorgo: 0.85,
  gergelim: 1.0,
  girassol: 1.0,
  braquiaria: 0.95,
  crotalaria: 0.95,
  feijao_guandu: 0.9,
  pousio_desnudo: 0.3,
};

/**
 * Eficiência de retenção da água pelo solo — que percentagem da chuva
 * fica disponível para a planta (o resto infiltra ou escorre).
 */
export const SOIL_RETENTION: Record<string, number> = {
  arenoso: 0.55,
  franco: 0.75,
  argiloso: 0.9,
};

/** Meses que ocupa cada ciclo da rotação. */
export const CYCLE_MONTHS: string[][] = [
  ["01", "02", "03", "04"], // Ciclo 1 — safra principal
  ["05", "06", "07", "08"], // Ciclo 2 — safrinha
  ["09", "10", "11", "12"], // Ciclo 3 — entressafra / cobertura
];

/** Nome curto de cada ciclo — como a pessoa o ouve no campo. */
export const CYCLE_STAGES = ["Safra principal", "Safrinha", "Entressafra"] as const;

/** Período de cada ciclo, em português do dia-a-dia. */
export const CYCLE_PERIODS = [
  "Janeiro a Abril",
  "Maio a Agosto",
  "Setembro a Dezembro",
] as const;

/**
 * Os 3 planos "prontos" — as combinações que a NASA recomenda.
 *
 * Em vez de obrigar a pessoa a escolher 3 culturas e a ajustar
 * selectores técnicos, oferecemos 3 rotas testadas. O Plano 4
 * (montar do meu jeito) fica sempre disponível para quem quer.
 */
export interface RotationPlan {
  id: string;
  /** Nome do plano, como a pessoa o ouve. */
  title: string;
  /** Legenda por baixo do nome. */
  subtitle: string;
  /** Prioridade do produtor a que o plano responde. */
  priority: FarmerPriority;
  /** Ids das culturas, por ordem de ciclo. */
  crops: [string, string, string];
  /** Porque é que este plano é bom — em linguagem simples. */
  description: string;
  /** Chave do ícone (o desenho vive no componente). */
  icon: "water" | "sprout" | "coins";
}

export const ROTATION_PLANS: RotationPlan[] = [
  {
    id: "plano_seca",
    title: "Super Resiliente à Seca",
    subtitle: "Recomendado pela NASA",
    priority: "agua",
    crops: ["milho", "feijao_caupi", "braquiaria"],
    description:
      "Para quando a chuva vem fraca. Estas plantas aguentam a seca e quase não precisam de água.",
    icon: "water",
  },
  {
    id: "plano_terra",
    title: "Recuperar a Terra",
    subtitle: "Plano 2 · Adubo natural",
    priority: "solo",
    crops: ["milho", "crotalaria", "feijao_guandu"],
    description:
      "Para terras cansadas. As leguminosas devolvem adubo natural à terra e tu poupas o adubo comprado.",
    icon: "sprout",
  },
  {
    id: "plano_feira",
    title: "Máximo Rendimento",
    subtitle: "Plano 3 · Para vender na feira",
    priority: "lucro",
    crops: ["milho", "soja", "gergelim"],
    description:
      "Mais tipos de comida para a tua família e para vender na feira.",
    icon: "coins",
  },
];

/** Objectivo do produtor — o Passo 1 do guia. */
export interface FarmerGoal {
  id: FarmerPriority;
  title: string;
  description: string;
  icon: "water" | "sprout" | "coins";
}

export const FARMER_GOALS: FarmerGoal[] = [
  {
    id: "agua",
    title: "Economizar Água",
    description: "Guardar cada gota de chuva que cai",
    icon: "water",
  },
  {
    id: "solo",
    title: "Recuperar a Terra",
    description: "Deixar a terra descansada e mais forte",
    icon: "sprout",
  },
  {
    id: "lucro",
    title: "Mais Comida e Vendas",
    description: "Diversificar a comida e o dinheiro",
    icon: "coins",
  },
];

/** Plano que corresponde a um objectivo do produtor. */
export function planForGoal(goal: FarmerPriority): RotationPlan {
  return ROTATION_PLANS.find((p) => p.priority === goal) ?? ROTATION_PLANS[0];
}

/**
 * O diagnóstico da agrônoma em português simples.
 *
 * Sem fórmulas, sem "ETc", sem "NDVI" — só o que a pessoa precisa
 * de fazer no campo, com os números que a NASA mediu.
 */
export function diagnosticoSimples(params: {
  cycleNames: string[];
  balance: RotationBalance;
  nitrogenKgHa: number;
  overallScore: number;
}): string {
  const { cycleNames, balance, nitrogenKgHa, overallScore } = params;
  const [c1, c2, c3] = cycleNames;
  const ciclo2 = balance.cycles[1];
  const sobraTotal = balance.totalBalanceMm;

  let texto = `Boa escolha: plantar ${c2} depois do ${c1} é exactamente o que a tua terra precisa. `;

  if (sobraTotal >= 0) {
    texto += `A NASA mediu ${balance.totalRainMm} mm de chuva na tua região e a tua rotação precisa de ${balance.totalDemandMm} mm — a água dá para a safra, sobrando ${sobraTotal} mm. `;
  } else {
    texto += `A NASA mediu ${balance.totalRainMm} mm de chuva na tua região e a tua rotação precisa de ${balance.totalDemandMm} mm — no conjunto faltam ${Math.abs(sobraTotal)} mm. `;
  }

  if (ciclo2 && ciclo2.balanceMm < 0) {
    texto += `O ponto mais apertado é o Ciclo 2 (Maio a Agosto), quando as chuvas já estão a acabar: faltam ${Math.abs(ciclo2.balanceMm)} mm. Rega o feijão uma vez por semana e ganhas uma colheita boa sem gastar dinheiro em adubo. `;
  } else if (ciclo2) {
    texto += `No Ciclo 2 (Maio a Agosto), quando as chuvas já estão a acabar, a tua rotação ainda dá conta: sobram ${ciclo2.balanceMm} mm. `;
  }

  if (nitrogenKgHa > 0) {
    texto += `As leguminosas devolvem à terra ${nitrogenKgHa} kg de azoto por hectare — é adubo grátis. `;
  }

  texto += `Se plantares ${c3} no último ciclo, a tua terra fica coberta até ao próximo ano: nunca fica nua ao sol, o que é a melhor forma de a proteger contra a seca. `;

  texto +=
    overallScore >= 80
      ? "No geral, a tua terra fica mais forte a cada ano."
      : "Vais notar a diferença na próxima safra.";

  return texto;
}

/**
 * Chuva efectiva (USDA-SCS): parte da chuva que fica disponível para
 * infiltrar no solo. Chuva acima de 250 mm/mês já transborda.
 */
export function effectiveRainfall(monthlyMm: number): number {
  const p = Math.max(0, monthlyMm);
  if (p <= 250) return (p * (125 - 0.2 * p)) / 125;
  return 125 + 0.1 * p;
}

/**
 * ETo média diária (mm/dia) de cada mês do ano, a partir da série da
 * NASA. Chave no formato "01".."12". Quando o período cobre o mesmo mês
 * em vários anos, faz-se a média.
 */
export function etoDailyByMonthOfYear(
  summary: AgroSummary,
  etoForPoint: (point: AgroSummary["series"][number]) => number,
): Record<string, number> {
  const sum: Record<string, number> = {};
  const count: Record<string, number> = {};

  for (const point of summary.series) {
    const monthOfYear = point.date.slice(4, 6);
    sum[monthOfYear] = (sum[monthOfYear] ?? 0) + etoForPoint(point);
    count[monthOfYear] = (count[monthOfYear] ?? 0) + 1;
  }

  const averages: Record<string, number> = {};
  for (const [month, total] of Object.entries(sum)) {
    averages[month] = total / (count[month] || 1);
  }
  return averages;
}

/** Dias em cada mês ( Fevereiro = 28 ). */
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface CycleBalance {
  cropId: string;
  cropName: string;
  /** ETc do ciclo (mm) */
  demandMm: number;
  /** Chuva efectiva nos meses do ciclo (mm) */
  rainMm: number;
  /** Chuva − demanda. Negativo = falta água. */
  balanceMm: number;
  /** Meses do ciclo */
  months: string[];
}

export interface RotationBalance {
  cycles: CycleBalance[];
  /** Demanda total da rotação (mm) */
  totalDemandMm: number;
  /** Chuva efectiva total (mm) */
  totalRainMm: number;
  /** Balanço total (mm) — negativo = risco de quebra por seca */
  totalBalanceMm: number;
  /** Nome do mês com mais chuva e o seu total (mm) */
  wettestMonth: { month: string; mm: number } | null;
  /** Comparação com a prática comum: monocultura na safra + pousio. */
  baseline: {
    label: string;
    demandMm: number;
    rainMm: number;
    balanceMm: number;
    nitrogenKgHa: number;
  };
}

/**
 * Calcula o balanço hídrico de uma rotação com base nos dados da NASA.
 */
export function rotationWaterBalance(
  crops: CropProfile[],
  summary: AgroSummary,
  soil: string,
  etoForPoint: (point: AgroSummary["series"][number]) => number,
): RotationBalance {
  const etoDaily = etoDailyByMonthOfYear(summary, etoForPoint);
  const retention = SOIL_RETENTION[soil] ?? 0.75;

  const cycles: CycleBalance[] = crops.map((crop, index) => {
    const months = CYCLE_MONTHS[index] ?? CYCLE_MONTHS[0];

    const totalDays = months.reduce(
      (sum, m) => sum + (DAYS_IN_MONTH[Number(m) - 1] ?? 30),
      0,
    );
    // O ciclo ocupa `typicalCycleDays` dos dias dos meses que lhe
    // tocam — a proporção é a mesma para a chuva e para a ETo.
    const share = Math.min(1, crop.typicalCycleDays / totalDays);

    // ETo (mm) do ciclo = ETo diária × dias de cada mês
    const etoCycle = months.reduce(
      (sum, m) =>
        sum + (etoDaily[m] ?? 0) * (DAYS_IN_MONTH[Number(m) - 1] ?? 30),
      0,
    );

    const kc = CROP_KC[crop.id] ?? 1.0;
    const demandMm = etoCycle * share * kc;

    const rainMm =
      months.reduce(
        (sum, m) => sum + effectiveRainfall(summary.rainByMonthOfYear[m] ?? 0),
        0,
      ) *
      share *
      retention;

    return {
      cropId: crop.id,
      cropName: crop.name,
      demandMm: Math.round(demandMm),
      rainMm: Math.round(rainMm),
      balanceMm: Math.round(rainMm - demandMm),
      months,
    };
  });

  const totalDemandMm = cycles.reduce((s, c) => s + c.demandMm, 0);
  const totalRainMm = cycles.reduce((s, c) => s + c.rainMm, 0);

  let wettestMonth: { month: string; mm: number } | null = null;
  for (const [month, mm] of Object.entries(summary.rainByMonthOfYear)) {
    if (!wettestMonth || mm > wettestMonth.mm) wettestMonth = { month, mm };
  }

  // ---- Comparação com a prática comum --------------------------------
  // "Monocultura na safra principal + pousio": a mesma cultura da_cycle 1
  // durante os meses da chuva e terra nua o resto do ano. É o que a
  // maioria faz — e o que esgota o solo.
  const baselineCrop = crops[0];
  const baselineMonths = CYCLE_MONTHS[0];
  const baselineTotalDays = baselineMonths.reduce(
    (sum, m) => sum + (DAYS_IN_MONTH[Number(m) - 1] ?? 30),
    0,
  );
  const baselineShare = Math.min(
    1,
    baselineCrop.typicalCycleDays / baselineTotalDays,
  );
  const baselineEto = baselineMonths.reduce(
    (sum, m) =>
      sum + (etoDaily[m] ?? 0) * (DAYS_IN_MONTH[Number(m) - 1] ?? 30),
    0,
  );
  const baselineDemand = baselineEto * baselineShare * (CROP_KC[baselineCrop.id] ?? 1);
  const baselineRain =
    baselineMonths.reduce(
      (sum, m) => sum + effectiveRainfall(summary.rainByMonthOfYear[m] ?? 0),
      0,
    ) *
    baselineShare *
    retention;

  return {
    cycles,
    totalDemandMm: Math.round(totalDemandMm),
    totalRainMm: Math.round(totalRainMm),
    totalBalanceMm: Math.round(totalRainMm - totalDemandMm),
    wettestMonth,
    baseline: {
      label: `${baselineCrop.name} em monocultura + pousio`,
      demandMm: Math.round(baselineDemand),
      rainMm: Math.round(baselineRain),
      balanceMm: Math.round(baselineRain - baselineDemand),
      nitrogenKgHa: baselineCrop.nitrogenFixationKgHa,
    },
  };
}
