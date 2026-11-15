/** Parâmetros de referência da NASA POWER (comunidade AG — agroclimatologia). */
export const NASA_POWER_PARAMETERS = [
  "T2M",
  "T2M_MAX",
  "T2M_MIN",
  "PRECTOTCORR",
  "RH2M",
  "ALLSKY_SFC_SW_DWN",
] as const;

export const NASA_POWER_BASE_URL =
  "https://power.larc.nasa.gov/api/temporal/daily/point";

export const NASA_POWER_CACHE_SECONDS = 86_400; // 24 h

export interface NasaPowerQuery {
  lat: number;
  lon: number;
  start: string; // YYYYMMDD
  end: string; // YYYYMMDD
}

export function buildNasaPowerUrl({ lat, lon, start, end }: NasaPowerQuery) {
  const params = new URLSearchParams({
    parameters: NASA_POWER_PARAMETERS.join(","),
    community: "AG",
    longitude: String(lon),
    latitude: String(lat),
    start,
    end,
    format: "JSON",
  });
  return `${NASA_POWER_BASE_URL}?${params.toString()}`;
}

/**
 * Consulta a NASA POWER com cache de 24 h na edge.
 * Poupa os dados móveis do utilizador — requisito do desafio.
 */
export async function fetchNasaPower(
  query: NasaPowerQuery,
  revalidate: number = NASA_POWER_CACHE_SECONDS
) {
  const res = await fetch(buildNasaPowerUrl(query), { next: { revalidate } });

  if (!res.ok) {
    throw new Error(`NASA POWER respondeu ${res.status}`);
  }

  return (await res.json()) as unknown;
}
