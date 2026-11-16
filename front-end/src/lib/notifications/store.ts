/**
 * Notificações da aplicação — cada resposta da API (boa ou má) fica
 * registada aqui e aparece no sino do cabeçalho.
 *
 * É um store simples (sem dependências): qualquer parte da aplicação
 * pode empurrar uma notificação e o sino subscreve para se actualizar.
 *
 * As notificações ficam guardadas no dispositivo (localStorage) para
 * que a Dona Maria não perca o histórico quando a página recarrega.
 */

export type NotificationKind = "sucesso" | "erro" | "info";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  /** Título curto — "Planta guardada". */
  title: string;
  /** Detalhe — a mensagem de erro da API, por exemplo. */
  message?: string;
  /** Código HTTP da resposta (quando vier da API). */
  status?: number;
  /** Endpoint chamada. */
  path?: string;
  /** Momento da resposta (epoch ms). */
  createdAt: number;
  read: boolean;
}

const STORAGE_KEY = "solo.notificacoes";
const MAX_ITEMS = 50;

type Listener = (items: AppNotification[]) => void;

let items: AppNotification[] = [];
let snapshot: AppNotification[] = [];
let loaded = false;
const listeners = new Set<Listener>();

/* -------------------------------------------------------------------------- */
/* Persistência                                                               */
/* -------------------------------------------------------------------------- */

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readStorage(): AppNotification[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as AppNotification[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((n) => n && typeof n.id === "string")
      .map((n) => ({ ...n, read: Boolean(n.read) }))
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function writeStorage(list: AppNotification[]): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Sem espaço no dispositivo — as notificações continuam visíveis.
  }
}

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Carrega do dispositivo uma única vez.
 *
 * O snapshot tem de ser sempre a *mesma* referência enquanto nada muda
 * — caso contrário o React entra em loop (ver `useSyncExternalStore`).
 */
function init(): void {
  if (loaded) return;
  loaded = true;
  items = readStorage();
  snapshot = items;
}

/** Notifica os que estão a ouvir (o sino). */
function emit(): void {
  snapshot = items;
  for (const listener of listeners) listener(snapshot);
}

/** Cria uma notificação. */
export function notify(input: {
  kind: NotificationKind;
  title: string;
  message?: string;
  status?: number;
  path?: string;
}): AppNotification {
  init();

  const item: AppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind,
    title: input.title,
    message: input.message,
    status: input.status,
    path: input.path,
    createdAt: Date.now(),
    read: false,
  };

  items = [item, ...items].slice(0, MAX_ITEMS);
  writeStorage(items);
  emit();

  return item;
}

/** Todas as notificações (mais recentes primeiro). */
export function listNotifications(): AppNotification[] {
  init();
  return snapshot;
}

/** Quantas ainda não foram lidas. */
export function unreadCount(): number {
  init();
  return snapshot.filter((n) => !n.read).length;
}

/** Marca tudo como lido. */
export function markAllRead(): void {
  init();
  items = items.map((n) => (n.read ? n : { ...n, read: true }));
  writeStorage(items);
  emit();
}

/** Marca uma notificação como lida. */
export function markRead(id: string): void {
  init();
  items = items.map((n) => (n.id === id ? { ...n, read: true } : n));
  writeStorage(items);
  emit();
}

/** Limpa todas as notificações. */
export function clearAll(): void {
  init();
  items = [];
  writeStorage(items);
  emit();
}

/** Subscreve o store (usado pelo hook e pelo sino). */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Snapshot estável para o `useSyncExternalStore`. */
export function getSnapshot(): AppNotification[] {
  init();
  return snapshot;
}

/* -------------------------------------------------------------------------- */
/* Mensagens por endpoint                                                     */
/* -------------------------------------------------------------------------- */

/** Títulos legíveis para cada operação da API. */
const SUCCESS_LABELS: Array<[RegExp, string]> = [
  [/^\/api\/v1\/plants$/, "Planta guardada"],
  [/^\/api\/v1\/plants\/.+$/, "Planta actualizada"],
  [/^\/api\/v1\/harvests$/, "Colheita registada"],
  [/^\/api\/v1\/plots$/, "Canteiro criado"],
  [/^\/api\/v1\/plots\/.+$/, "Canteiro removido"],
  [/^\/api\/v1\/analyze$/, "Diagnóstico da terra guardado"],
  [/^\/api\/v1\/finance\/transactions$/, "Lançamento guardado"],
  [/^\/api\/v1\/agronomist\/messages$/, "Mensagem enviada à agrônoma"],
  [/^\/api\/v1\/auth\/register$/, "Conta criada"],
  [/^\/api\/v1\/auth\/verify-otp$/, "Código verificado"],
  [/^\/api\/v1\/auth\/resend-otp$/, "Código reenviado"],
  [/^\/api\/v1\/auth\/login$/, "Sessão iniciada"],
  [/^\/api\/v1\/auth\/logout$/, "Sessão terminada"],
  [/^\/api\/nasa\//, "Dados do satélite actualizados"],
];

const ERROR_LABELS: Array<[RegExp, string]> = [
  [/^\/api\/v1\/plants$/, "Não foi possível guardar a planta"],
  [/^\/api\/v1\/plants\/.+$/, "Não foi possível actualizar a planta"],
  [/^\/api\/v1\/harvests$/, "Não foi possível registar a colheita"],
  [/^\/api\/v1\/plots$/, "Não foi possível criar o canteiro"],
  [/^\/api\/v1\/plots\/.+$/, "Não foi possível remover o canteiro"],
  [/^\/api\/v1\/analyze$/, "Não foi possível guardar o diagnóstico"],
  [/^\/api\/v1\/finance\/transactions$/, "Não foi possível guardar o lançamento"],
  [/^\/api\/v1\/agronomist\/messages$/, "Não foi possível enviar a mensagem"],
  [/^\/api\/v1\/auth\/register$/, "Não foi possível criar a conta"],
  [/^\/api\/v1\/auth\/verify-otp$/, "Não foi possível verificar o código"],
  [/^\/api\/v1\/auth\/resend-otp$/, "Não foi possível reenviar o código"],
  [/^\/api\/v1\/auth\/login$/, "Não foi possível entrar na conta"],
  [/^\/api\/v1\/auth\/logout$/, "Não foi possível terminar a sessão"],
  [/^\/api\/nasa\//, "Não foi possível ir buscar os dados do satélite"],
];

function matchLabel(
  labels: Array<[RegExp, string]>,
  path: string,
  fallback: string,
): string {
  for (const [pattern, label] of labels) {
    if (pattern.test(path)) return label;
  }
  return fallback;
}

/** Notificação de sucesso vinda da API. */
export function notifyApiSuccess(method: string, path: string, status: number): void {
  const title =
    method === "GET"
      ? "Dados actualizados"
      : matchLabel(SUCCESS_LABELS, path, "Operação concluída");

  notify({ kind: "sucesso", title, status, path });
}

/** Notificação de erro vinda da API. */
export function notifyApiError(
  method: string,
  path: string,
  message: string,
  status?: number,
): void {
  const title =
    method === "GET"
      ? "Não foi possível ir buscar os dados"
      : matchLabel(ERROR_LABELS, path, "O servidor não respondeu como esperado");

  notify({ kind: "erro", title, message, status, path });
}
