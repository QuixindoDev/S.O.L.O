/**
 * Perfil da fazenda — dados de exemplo do utilizador.
 *
 * Num projecto real isto viria de um formulário persistido
 * (ver ecrã 1 — Criar Conta). Para já é a fonte única de verdade
 * para nome, localização e coordenadas usadas nas chamadas à NASA.
 */

export interface FarmProfile {
  userName: string;
  farmName: string;
  initials: string;
  city: string;
  state: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  /** Textura do solo — usada pelos scores de retenção de água. */
  soil: "arenoso" | "argiloso" | "franco";
  /** Área da terra em hectares — base do carbono que a terra guarda. */
  areaHectares: number;
}

export const defaultFarm: FarmProfile = {
  userName: "Dona Maria",
  farmName: "Sítio Recanto Verde",
  initials: "DM",
  city: "Huambo",
  state: "Huíla",
  locationLabel: "Huambo - Huíla",
  latitude: -12.776,
  longitude: 15.739,
  soil: "franco",
  areaHectares: 2.5,
};
