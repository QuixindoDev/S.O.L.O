"use client";

import { useMemo } from "react";
import cropsDatabase from "@/data/crops.json";
import {
  BiomeType,
  CropProfile,
  FarmerPriority,
  RotationSequenceSelection,
  SimulationResult,
  SoilTextureType,
} from "@/types/agronomy";
import type { AgroSummary } from "@/types/nasa";
import { referenceEvapotranspiration } from "@/lib/agronomia";
import { rotationWaterBalance, type RotationBalance } from "@/lib/rotacao";

const cropsMap = new Map<string, CropProfile>(
  (cropsDatabase as CropProfile[]).map((c) => [c.id, c]),
);

export interface RotationSimulation extends SimulationResult {
  /** Balanço hídrico da rotação, calculado com os dados da NASA. */
  balance: RotationBalance;
  /** Nome da cultura de cada ciclo, por ordem. */
  cycleNames: string[];
}

/**
 * Motor de simulação da rotação.
 *
 * Combina:
 *  - as características agronómicas de cada cultura (`crops.json`);
 *  - o solo e o bioma escolhidos pela Dona Maria;
 *  - a **chuva e a radiação reais da NASA POWER**;
 *  - a prioridade que ela escolheu, que define os pesos dos scores.
 */
export function useSimulator(
  biome: BiomeType,
  soil: SoilTextureType,
  priority: FarmerPriority,
  selection: RotationSequenceSelection,
  summary: AgroSummary | null,
): RotationSimulation {
  return useMemo(() => {
    const c1 = cropsMap.get(selection.cycle1CropId) ?? (cropsDatabase[0] as CropProfile);
    const c2 = cropsMap.get(selection.cycle2CropId) ?? (cropsDatabase[2] as CropProfile);
    const c3 = cropsMap.get(selection.cycle3CropId) ?? (cropsDatabase[4] as CropProfile);

    // ---- Balanço hídrico com os dados reais da NASA -------------------
    const emptySummary: AgroSummary = {
      latitude: 0,
      longitude: 0,
      elevationM: 0,
      current: null,
      last7: [],
      series: [],
      monthlyRainMm: {},
      rainByMonthOfYear: {},
      annualRainMm: 0,
      avgTMax: 0,
      avgTMin: 0,
      avgHumidity: 0,
      lastSatellitePass: null,
      daysSinceRain: 0,
    };

    const balance = rotationWaterBalance(
      [c1, c2, c3],
      summary ?? emptySummary,
      soil,
      (point) => referenceEvapotranspiration(point, summary?.latitude ?? 0),
    );

    // ---- Scores -------------------------------------------------------
    let avgWaterEfficiency =
      (c1.waterEfficiencyBase + c2.waterEfficiencyBase + c3.waterEfficiencyBase) / 3;
    let avgDroughtResilience =
      (c1.droughtToleranceScore + c2.droughtToleranceScore + c3.droughtToleranceScore) / 3;
    const netNitrogenKg =
      c1.nitrogenFixationKgHa + c2.nitrogenFixationKgHa + c3.nitrogenFixationKgHa;

    // Modificadores do solo
    if (soil === "arenoso") {
      avgWaterEfficiency = Math.max(15, avgWaterEfficiency - 12);
      avgDroughtResilience = Math.max(15, avgDroughtResilience - 10);
    } else if (soil === "franco") {
      avgWaterEfficiency = Math.min(99, avgWaterEfficiency + 5);
    }

    // Modificadores do bioma
    if (biome === "semiarido") {
      avgDroughtResilience = Math.max(10, avgDroughtResilience - 8);
    }

    // O défice de água medido pela NASA penaliza a eficiência hídrica
    let normWater = Math.max(10, Math.min(99, Math.round(avgWaterEfficiency)));
    if (balance.totalBalanceMm < 0) {
      const deficit = Math.min(45, Math.round(Math.abs(balance.totalBalanceMm) / 12));
      normWater = Math.max(10, normWater - deficit);
    }

    const normSoil = Math.max(
      10,
      Math.min(99, Math.round(50 + netNitrogenKg * 0.4)),
    );
    const normResilience = Math.max(
      10,
      Math.min(99, Math.round(avgDroughtResilience)),
    );

    // Pesos conforme a prioridade da Dona Maria
    let overall: number;
    if (priority === "agua") {
      overall = Math.round(normWater * 0.5 + normSoil * 0.25 + normResilience * 0.25);
    } else if (priority === "solo") {
      overall = Math.round(normSoil * 0.5 + normWater * 0.25 + normResilience * 0.25);
    } else if (priority === "resiliencia") {
      overall = Math.round(normResilience * 0.5 + normWater * 0.3 + normSoil * 0.2);
    } else {
      overall = Math.round(normWater * 0.33 + normSoil * 0.33 + normResilience * 0.34);
    }

    let rating: SimulationResult["resilienceRating"] = "Excelente";
    if (overall < 50) {
      rating = "Alto Risco de Quebra";
    } else if (overall < 75) {
      rating = "Atenção ao Estresse Hídrico";
    }

    // ---- Recomendação em linguagem natural ----------------------------
    const short = balance.totalBalanceMm < 0;
    let advice = `Sequência escolhida: ${c1.name} ➔ ${c2.name} ➔ ${c3.name}. `;

    if (selection.cycle3CropId === "pousio_desnudo") {
      advice +=
        "Aviso importante: deixar a terra em pousio desnudo na entressafra acelera a perda de água por evaporação e provoca erosão. Recomendamos cobertura vegetal com Braquiária ou Crotalária.";
    } else if (short) {
      advice += `Segundo a NASA POWER, esta rotação precisa de ${balance.totalDemandMm} mm de água e caíram ${balance.totalRainMm} mm de chuva na sua região neste período — faltam ${Math.abs(balance.totalBalanceMm)} mm. `;
      advice +=
        "Escolha uma cultura mais rustica no segundo ciclo (Feijão-Caupi ou Sorgo) ou prepare a rega. Sem água, a safra quebra.";
    } else if (overall >= 80) {
      advice += `Excelente combinação: a rotação precisa de ${balance.totalDemandMm} mm e a NASA mediu ${balance.totalRainMm} mm de chuva — a água dá para a safra. `;
      advice +=
        "O equilíbrio entre fixação biológica de nitrogénio e tolerância ao calor reduz a necessidade de rega e melhora a terra para a próxima safra.";
    } else {
      advice += `A rotação precisa de ${balance.totalDemandMm} mm e a NASA mediu ${balance.totalRainMm} mm de chuva — a água dá, mas por pouco. `;
      advice +=
        "Acompanhe a humidade do solo na zona radicular antes de semear o segundo ciclo.";
    }

    const waterSavedLiters = Math.max(15, Math.round((normWater / 100) * 180));

    const monthlyET = [
      Math.round(c1.waterDemandScore * 0.9),
      Math.round(c1.waterDemandScore * 1.2),
      Math.round(c1.waterDemandScore * 1.0),
      Math.round(c2.waterDemandScore * 0.8),
      Math.round(c2.waterDemandScore * 1.1),
      Math.round(c2.waterDemandScore * 0.7),
      Math.round(c3.waterDemandScore * 0.5),
      Math.round(c3.waterDemandScore * 0.4),
      Math.round(c3.waterDemandScore * 0.4),
      Math.round(c1.waterDemandScore * 0.6),
      Math.round(c1.waterDemandScore * 0.8),
      Math.round(c1.waterDemandScore * 1.0),
    ];

    return {
      overallScore: overall,
      waterEfficiencyScore: normWater,
      soilRegenerationScore: normSoil,
      climateResilienceScore: normResilience,
      estimatedWaterSavedLitersM2: waterSavedLiters,
      estimatedNitrogenBalanceKgHa: netNitrogenKg,
      resilienceRating: rating,
      naturalLanguageAdvice: advice,
      monthlyCropEvapotranspirationMm: monthlyET,
      balance,
      cycleNames: [c1.name, c2.name, c3.name],
    };
  }, [biome, soil, priority, selection, summary]);
}
