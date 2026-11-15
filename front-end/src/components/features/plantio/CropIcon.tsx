"use client";

import React from "react";
import {
  Bean,
  CircleDashed,
  Flower2,
  Sprout,
  Sun,
  Wheat,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Ícone de cada cultura no calendário. */
const CROP_ICONS: Record<string, LucideIcon> = {
  milho: Wheat,
  sorgo: Wheat,
  girassol: Sun,
  soja: Bean,
  feijao_caupi: Bean,
  feijao_guandu: Bean,
  braquiaria: Sprout,
  crotalaria: Sprout,
  gergelim: Flower2,
  pousio_desnudo: CircleDashed,
};

export interface CropIconProps {
  cropId: string;
  size?: number;
  className?: string;
}

/** O ícone da cultura — o mesmo traço do resto da app. */
export function CropIcon({ cropId, size = 20, className }: CropIconProps) {
  const Icon = CROP_ICONS[cropId] ?? Sprout;
  return <Icon size={size} className={className} aria-hidden />;
}
