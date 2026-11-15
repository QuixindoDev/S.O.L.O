/**
 * Saques — o dinheiro que a Dona Maria já levantou e onde recebe.
 *
 * Fica guardado no dispositivo (e depois vai para o banco): os saques
 * e o método de saque escolhido.
 */

const SAQUES_KEY = "solo.saques";
const METODO_KEY = "solo.metodo.saque";

/** Um saque já feito. */
export interface Saque {
  id: string;
  /** Data do saque (ISO). */
  data: string;
  /** Valor em kwanzas. */
  kz: number;
  /** Descrição do método usado ("M-Pesa 923 456 789"). */
  metodo: string;
}

/** Onde o dinheiro vai. */
export interface MetodoSaque {
  tipo: "telemovel" | "banco";
  /** Identificador mostrado (número da linha ou IBAN). */
  referencia: string;
  /** Nome que a pessoa dá ao método ("M-Pesa da mana"). */
  nome?: string;
}

/** Todos os saques já feitos (do mais recente para o mais antigo). */
export function loadSaques(): Saque[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAQUES_KEY);
    if (!raw) return [];
    const lista = JSON.parse(raw) as Saque[];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

/** Regista um saque novo. */
export function addSaque(saque: Omit<Saque, "id" | "data">): Saque[] {
  const novo: Saque = {
    ...saque,
    id: `saque-${Date.now()}`,
    data: new Date().toISOString(),
  };
  const lista = [novo, ...loadSaques()];
  try {
    window.localStorage.setItem(SAQUES_KEY, JSON.stringify(lista));
  } catch {
    // Sem espaço no dispositivo — o valor continua visível no ecrã.
  }
  return lista;
}

/** Total já levantado (kz). */
export function totalSacado(saques: Saque[]): number {
  return saques.reduce((soma, saque) => soma + saque.kz, 0);
}

/** Método de saque registado (ou null). */
export function loadMetodoSaque(): MetodoSaque | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(METODO_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MetodoSaque;
  } catch {
    return null;
  }
}

/** Guarda o método de saque escolhido. */
export function saveMetodoSaque(metodo: MetodoSaque): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(METODO_KEY, JSON.stringify(metodo));
  } catch {
    // Sem espaço no dispositivo.
  }
}

/** Descrição curta do método, para mostrar no ecrã. */
export function descreverMetodo(metodo: MetodoSaque | null): string {
  if (!metodo) return "Ainda não registaste nenhum método de saque";
  if (metodo.tipo === "telemovel") {
    return `Carteira de telemóvel ${metodo.referencia}`;
  }
  return `Conta bancária ${metodo.referencia}`;
}
