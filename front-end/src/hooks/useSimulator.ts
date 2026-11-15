"use client";

import { useMemo } from "react";
import cropsDatabase from "@/data/crops";
import {
  BiomeType,
  CropProfile,
  FarmerPriority,
  RotationSequenceSelection,
  SimulationResult,
  SoilTextureType,
} from "@/types/agronomy";
import type { AgroSummary } from "@/types/nasa";

const cropsMap = new Map<string, CropProfile>(
  cropsDatabase.map((c) => [c.id, c])
);

import { rotationWaterBalance } from "@/lib/rotacao";
import type { RotationBalance } from "@/lib/rotacao";

export type RotationSimulation = SimulationResult & {
  balance: RotationBalance;
  cycleNames: string[];
};

// Sem dados da NASA, o balanço sai a zeros em vez de rebentar.
const EMPTY_SUMMARY = {
  series: [],
  rainByMonthOfYear: {},
} as unknown as AgroSummary;

export function useSimulator(
  biome: BiomeType,
  soil: SoilTextureType,
  priority: FarmerPriority,
  selection: RotationSequenceSelection,
  summary?: AgroSummary | null
): RotationSimulation {
  return useMemo(() => {
    const c1 = cropsMap.get(selection.cycle1CropId) || (cropsDatabase[0] as CropProfile);
    const c2 = cropsMap.get(selection.cycle2CropId) || (cropsDatabase[2] as CropProfile);
    const c3 = cropsMap.get(selection.cycle3CropId) || (cropsDatabase[4] as CropProfile);

    // Baseline averages
    let avgWaterEfficiency = (c1.waterEfficiencyBase + c2.waterEfficiencyBase + c3.waterEfficiencyBase) / 3;
    let avgDroughtResilience = (c1.droughtToleranceScore + c2.droughtToleranceScore + c3.droughtToleranceScore) / 3;
    const netNitrogenKg = c1.nitrogenFixationKgHa + c2.nitrogenFixationKgHa + c3.nitrogenFixationKgHa;

    // Soil modifiers
    if (soil === "arenoso") {
      avgWaterEfficiency = Math.max(15, avgWaterEfficiency - 12);
      avgDroughtResilience = Math.max(15, avgDroughtResilience - 10);
    } else if (soil === "franco") {
      avgWaterEfficiency = Math.min(99, avgWaterEfficiency + 5);
    }

    // Biome modifiers
    if (biome === "semiarido") {
      avgDroughtResilience = Math.max(10, avgDroughtResilience - 8);
    }

    // Normalized scores (0-100)
    const normWater = Math.max(10, Math.min(99, Math.round(avgWaterEfficiency)));
    const normSoil = Math.max(10, Math.min(99, Math.round(50 + netNitrogenKg * 0.4)));
    const normResilience = Math.max(10, Math.min(99, Math.round(avgDroughtResilience)));

    // Weighting according to farmer's selected priority
    let overall = 0;
    if (priority === "agua") {
      overall = Math.round(normWater * 0.5 + normSoil * 0.25 + normResilience * 0.25);
    } else if (priority === "solo") {
      overall = Math.round(normSoil * 0.5 + normWater * 0.25 + normResilience * 0.25);
    } else if (priority === "resiliencia") {
      overall = Math.round(normResilience * 0.5 + normWater * 0.3 + normSoil * 0.2);
    } else {
      // Balance / Profit
      overall = Math.round(normWater * 0.33 + normSoil * 0.33 + normResilience * 0.34);
    }

    // Resilience rating category
    let rating: SimulationResult["resilienceRating"] = "Excelente";
    if (overall < 50) {
      rating = "Alto Risco de Quebra";
    } else if (overall < 75) {
      rating = "Atenção ao Stresse Hídrico";
    }

    // Natural Language Agronomic Advice
    let advice = `Sequência configurada: ${c1.name} ➔ ${c2.name} ➔ ${c3.name}. `;
    if (selection.cycle3CropId === "pousio_desnudo") {
      advice += "Aviso Crítico: Deixar a terra em pousio desnudo na entressafra acelera a perda de água por evaporação e provoca erosão severa. Recomendamos cobertura vegetal com braquiária ou crotalária.";
    } else if (overall >= 80) {
      advice += "Excelente combinação agroecológica. O equilíbrio entre fixação biológica de nitrogénio e tolerância ao stresse térmico reduz a demanda hídrica e melhora a estrutura da rizosfera.";
    } else if (normWater < 50) {
      advice += "Alerta de déficit hídrico: O consumo acumulado desta combinação excede a média pluviométrica histórica da NASA para este bioma. Risco de quebra de safra no segundo ciclo.";
    } else {
      advice += "Plano balanceado com boa retenção hídrica. Acompanhe a humidade da zona radicular (NASA SMAP) antes da semeadura do segundo ciclo.";
    }

    // Estimated water saved (liters/m² per year)
    const waterSavedLiters = Math.max(15, Math.round((normWater / 100) * 180));

    // Simulated 12-month crop evapotranspiration curve
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

    const balance = rotationWaterBalance(
      [c1, c2, c3],
      summary ?? EMPTY_SUMMARY,
      soil,
      (point) => point.et0Mm,
    );

    return {
      balance,
      cycleNames: [c1.name, c2.name, c3.name],
      overallScore: overall,
      waterEfficiencyScore: normWater,
      soilRegenerationScore: normSoil,
      climateResilienceScore: normResilience,
      estimatedWaterSavedLitersM2: waterSavedLiters,
      estimatedNitrogenBalanceKgHa: netNitrogenKg,
      resilienceRating: rating,
      naturalLanguageAdvice: advice,
      monthlyCropEvapotranspirationMm: monthlyET,
    };
  }, [biome, soil, priority, selection, summary]);
}
