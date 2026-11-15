/**
 * Agronomic & Crop Simulation Data Models
 * S.O.L.O. - Smart Observation Land Optimization
 */

export type SoilTextureType = "arenoso" | "argiloso" | "franco";

export type BiomeType = "semiarido" | "savana" | "subtropical" | "tropical";

export type FarmerPriority = "agua" | "solo" | "lucro" | "resiliencia";

export interface CropProfile {
  id: string;
  name: string;
  scientificName: string;
  category: "cereal" | "legume" | "oilseed" | "cover_crop" | "tuber";
  waterDemandScore: number;     // 0-100 (100 = very high consumption, e.g. rice, maize)
  waterEfficiencyBase: number;  // 0-100 (100 = survives with minimal water, e.g. cowpea)
  nitrogenFixationKgHa: number; // positive = adds N to soil, negative = depletes N
  rootDepthCm: number;          // Root depth in cm (e.g. Brachiaria > 200cm)
  droughtToleranceScore: number;// 0-100
  heatToleranceScore: number;   // 0-100
  typicalCycleDays: number;     // Days from emergence to physiological maturity
  recommendedSeason: "main_rainy" | "second_season" | "cover_fallow" | "any";
  description: string;
}

export interface RotationSequenceSelection {
  cycle1CropId: string; // Main rainy season crop
  cycle2CropId: string; // Second season / Safrinha crop
  cycle3CropId: string; // Dry cover / Fallow crop
}

export interface SimulationResult {
  overallScore: number;           // 0 - 100%
  waterEfficiencyScore: number;   // 0 - 100%
  soilRegenerationScore: number;  // 0 - 100%
  climateResilienceScore: number; // 0 - 100%
  estimatedWaterSavedLitersM2: number;
  estimatedNitrogenBalanceKgHa: number;
  resilienceRating: "Excelente" | "Atenção ao Stresse Hídrico" | "Alto Risco de Quebra";
  naturalLanguageAdvice: string;
  monthlyCropEvapotranspirationMm: number[];
}
