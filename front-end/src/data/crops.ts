import crops from "./crops.json";
import type { CropProfile } from "@/types/agronomy";

/**
 * Matriz agronómica das culturas de agricultura familiar angolana.
 * Fonte de dados: `crops.json` (JSON puro para publicação na web).
 */
export const cropsDatabase = crops as CropProfile[];

export function getCrop(id: string): CropProfile | undefined {
  return cropsDatabase.find((c) => c.id === id);
}

export default cropsDatabase;
