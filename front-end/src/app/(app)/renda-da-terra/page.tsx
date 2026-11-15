import React from "react";
import { RendaCarbono } from "@/components/features/renda/RendaCarbono";
import { api } from "@/lib/api/endpoints";
import { getFarmProfile, getServerToken } from "@/lib/api/server";
import type { DiagnosticoDto } from "@/lib/api/types";

/**
 * Ecrã 9 — "A Renda da Minha Terra" (carbono).
 *
 * A renda é calculada no ecrã a partir da rotação guardada, e
 * confirmada pelo back-end: o diagnóstico oficial (créditos de
 * carbono em tCO₂e e USD) vem de GET /api/v1/analyses.
 */
export const revalidate = 300;

export default async function RendaDaTerraPage() {
  const [profile, token] = await Promise.all([getFarmProfile(), getServerToken()]);

  // As análises do agricultor autenticado; sem sessão, o histórico geral.
  let analise: DiagnosticoDto | null = null;
  try {
    if (token) {
      const me = await api.auth.me({ token, revalidate: 300 });
      const analyses = await api.farmers.analyses(me.uuid, { token, revalidate: 300 });
      analise = analyses[0] ?? null;
    } else {
      const analyses = await api.analyses.list({ revalidate: 300 });
      analise = analyses[0] ?? null;
    }
  } catch (error) {
    console.error("[renda] sem diagnóstico do servidor:", error);
  }

  return (
    <RendaCarbono
      key={profile.areaHectares}
      areaHectares={profile.areaHectares}
      locationLabel={profile.locationLabel}
      analiseServidor={analise}
    />
  );
}
