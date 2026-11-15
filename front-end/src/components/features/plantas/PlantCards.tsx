"use client";

import React from "react";
import Image from "next/image";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { cropImageFor } from "@/lib/cropImage";
import type { PlantDto, PlotDto } from "@/lib/api/types";

export interface PlantCardsProps {
  /** Plantas da horta (vem do back-end: GET /api/v1/plants). */
  plants: PlantDto[];
  /** Canteiros, para mostrar onde está cada planta. */
  plots: PlotDto[];
}

/** O estado da planta decide a cor da etiqueta (verde, neutro ou aviso). */
function toneDaEtiqueta(plant: PlantDto): BadgeTone {
  if (plant.tone === "primary") return "primary";
  if (/agua|água|seco|sede/i.test(`${plant.status} ${plant.care ?? ""}`)) {
    return "warning";
  }
  return "soft";
}

/**
 * "Minhas plantas" em cards — a fotografia da cultura no topo, o nome,
 * o canteiro e a etiqueta de estado por baixo.
 *
 * Fica acima da lista com os cuidados de cada planta.
 */
export function PlantCards({ plants, plots }: PlantCardsProps) {
  const NOMES_CANTEIRO: Record<string, string> = Object.fromEntries(
    plots.map((canteiro) => [canteiro.id, canteiro.name]),
  );

  if (plants.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {plants.map((plant) => (
        <div
          key={plant.id}
          className="flex flex-col overflow-hidden rounded-[18px] border border-border bg-surface-soft"
        >
          <div className="relative h-[110px] w-full shrink-0">
            <Image
              src={cropImageFor(plant.name)}
              alt={`Foto da planta ${plant.name}`}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 180px"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col gap-2 p-3.5 pb-4">
            <span className="text-[17px] font-bold leading-tight text-text-primary">
              {plant.name}
            </span>
            <span className="text-[13px] text-text-muted">
              {NOMES_CANTEIRO[plant.plotId] ?? plant.plotId}
            </span>
            <Badge
              tone={toneDaEtiqueta(plant)}
              size="sm"
              className="self-start whitespace-nowrap"
            >
              {plant.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
