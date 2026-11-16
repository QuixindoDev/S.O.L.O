/**
 * Cliente HTTP do back-end Field Shift.
 *
 * Um único ponto de saída para todos os pedidos:
 *  - junta a URL base (`NEXT_PUBLIC_API_URL`);
 *  - acrescenta o token Bearer quando há sessão activa;
 *  - aplica timeout (a NASA e o GEE às vezes demoram 10–20 s);
 *  - transforma erros do FastAPI (`detail`) em mensagens legíveis.
 */

import { apiUrl } from "./config";
import { notifyApiError, notifyApiSuccess } from "@/lib/notifications/store";

export class ApiError extends Error {
  readonly status: number;
  readonly detail?: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Corpo JSON (serializado automaticamente). */
  body?: unknown;
  /** Token Bearer (JWT devolvido por /api/v1/auth/login). */
  token?: string | null;
  /** Parâmetros de query. */
  query?: Record<string, string | number | undefined>;
  /** Tempo limite da resposta, em milissegundos. */
  timeoutMs?: number;
  /**
   * Cache no servidor (ISR / Data Cache do Next.js), em segundos.
   * Só tem efeito nos Server Components e Route Handlers.
   */
  revalidate?: number;
  /** `true` para nunca usar cache (mutações e leituras “fresh”). */
  noStore?: boolean;
  /**
   * `true` para não gerar notificação desta chamada (ex.: verificações
   * silenciosas de saúde do servidor).
   */
  silent?: boolean;
}

const DEFAULT_TIMEOUT_MS = 30_000;

/** Extrai a mensagem legível de um erro do FastAPI. */
function extractDetail(payload: unknown): { message: string; detail?: unknown } {
  if (!payload || typeof payload !== "object") {
    return { message: "Erro inesperado no servidor." };
  }

  const body = payload as Record<string, unknown>;
  const detail = body.detail;

  if (typeof detail === "string") return { message: detail, detail };
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as Record<string, unknown> | undefined;
    const msg = first?.msg;
    if (typeof msg === "string") return { message: msg, detail };
  }
  if (typeof body.message === "string") return { message: body.message, detail };

  return { message: "Erro inesperado no servidor.", detail };
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    token,
    query,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    revalidate,
    noStore,
    silent = false,
  } = options;

  const url = apiUrl(path, query);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const isServer = typeof window === "undefined";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const init: RequestInit & { next?: { revalidate?: number } } = {
    method,
    headers,
    signal: controller.signal,
  };

  if (body !== undefined) init.body = JSON.stringify(body);

  if (isServer) {
    if (noStore) {
      init.cache = "no-store";
    } else if (typeof revalidate === "number") {
      init.next = { revalidate };
    }
  }

  try {
    const response = await fetch(url, init);

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      const { message, detail } = extractDetail(payload);
      throw new ApiError(message, response.status, detail);
    }

    // Toda a resposta da API (positiva ou negativa) fica no sino das
    // notificações — no browser, onde a pessoa está a ver.
    if (!isServer && !silent) {
      notifyApiSuccess(method, path, response.status);
    }

    return payload as T;
  } catch (error) {
    const apiError = toApiError(error);

    if (!isServer && !silent) {
      notifyApiError(method, path, apiError.message, apiError.status || undefined);
    }

    throw apiError;
  } finally {
    clearTimeout(timer);
  }
}

/** Converte qualquer erro num `ApiError` com mensagem legível. */
function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if ((error as Error)?.name === "AbortError") {
    return new ApiError(
      "O servidor demorou demasiado tempo a responder. Tente novamente.",
      504,
    );
  }

  return new ApiError(
    `Não foi possível contactar o servidor. Verifique se a ligação está boa e tente novamente.`,
    0,
    error,
  );
}
