/**
 * Acesso ao back-end a partir do servidor (Server Components e Route Handlers).
 *
 * Aqui o token vem do cookie da sessão e os pedidos podem usar a cache
 * do Next.js (`revalidate`), para o ecrã aparecer de imediato no 3G rural.
 */

import { cookies } from "next/headers";
import { api } from "./endpoints";
import { SESSION_COOKIE_NAME } from "./session";
import { defaultFarm, type FarmProfile } from "@/lib/farm";
import type { FarmProfileDto } from "./types";

/** Token da sessão (cookie) — `null` quando ninguém está autenticado. */
export async function getServerToken(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(SESSION_COOKIE_NAME)?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Perfil da propriedade vindo do back-end.
 *
 * Se o back-end não responder, usa o perfil de demonstração — a app
 * nunca fica com ecrã em branco.
 */
export async function getFarmProfile(): Promise<FarmProfile> {
  const token = await getServerToken();

  try {
    const profile = await api.profile.get({
      token,
      revalidate: 3600,
      timeoutMs: 10_000,
    });

    return {
      userName: profile.userName || defaultFarm.userName,
      farmName: profile.farmName || defaultFarm.farmName,
      initials: initialsOf(profile.userName || defaultFarm.userName),
      city: profile.city || defaultFarm.city,
      state: profile.state || defaultFarm.state,
      locationLabel: profile.locationLabel || defaultFarm.locationLabel,
      latitude: profile.latitude ?? defaultFarm.latitude,
      longitude: profile.longitude ?? defaultFarm.longitude,
      soil: profile.soil ?? defaultFarm.soil,
      areaHectares: profile.areaHectares ?? defaultFarm.areaHectares,
    };
  } catch (error) {
    console.error("[api] perfil indisponível, a usar o perfil local:", error);
    return defaultFarm;
  }
}

/** "Dona Maria" → "DM" */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export type { FarmProfileDto };
