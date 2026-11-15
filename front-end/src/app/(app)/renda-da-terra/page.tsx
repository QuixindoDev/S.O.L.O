import React from "react";
import { RendaCarbono } from "@/components/features/renda/RendaCarbono";
import { defaultFarm } from "@/lib/farm";

/**
 * Ecrã 9 — "A Renda da Minha Terra" (carbono).
 *
 * O carbono que a rotação guarda no solo é medido a partir dos dados
 * da cultura e da área da terra — não é preciso ir ao satellite
 * para este ecrã, por isso renderiza-se no servidor.
 */
export default function RendaDaTerraPage() {
  return <RendaCarbono key={defaultFarm.areaHectares} />;
}
