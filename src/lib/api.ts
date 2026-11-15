/**
 * Cliente HTTP do S.O.L.O.
 *
 * Um único sítio onde se fala com o servidor. As páginas nunca fazem `fetch`
 * directamente: assim mudamos a base do URL, os cabeçalhos ou o tratamento
 * de erros num só lugar.
 *
 * Quando o backend ainda não existe, cada serviço cai no "modo de mentira"
 * (`mock`), que simula a latência e devolve uma resposta válida — para o
 * produto já poder ser testado no campo.
 */

import type { ApiResponse, LoginPayload, RegisterPayload } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

/** Erro de rede/HTTP já traduzido para uma frase que o produtor entende. */
export class ApiError extends Error {
  readonly success = false as const;

  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** Headers padrão — JSON em ambos os sentidos. */
function headers(): HeadersInit {
  return { "Content-Type": "application/json" };
}

/**
 * Faz o POST e normaliza a resposta num `ApiResponse`.
 * Qualquer erro de rede ou HTTP não-2xx vira `ApiError` com mensagem em português.
 */
async function post<T>(
  path: string,
  payload: unknown,
  opcao?: { signal?: AbortSignal }
): Promise<ApiResponse<T>> {
  let res: Response;

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
      signal: opcao?.signal,
    });
  } catch {
    throw new ApiError(
      "Não foi possível falar com o servidor. Verifique a sua internet e tente novamente."
    );
  }

  // O servidor pode responder 200 mas com um corpo Unexpected (ex.: 500 do proxy).
  let corpo: Partial<ApiResponse<T>> = {};
  try {
    corpo = (await res.json()) as Partial<ApiResponse<T>>;
  } catch {
    // corpo não é JSON — segue a validação do status HTTP
  }

  if (!res.ok) {
    throw new ApiError(
      corpo?.message ??
        "O servidor não conseguiu responder agora. Tente novamente daqui a pouco."
    );
  }

  return {
    ok: corpo.ok ?? true,
    success: corpo.success ?? true,
    message: corpo.message ?? "",
    data: corpo.data,
  };
}

/**
 * Simula a resposta do servidor enquanto o backend não está pronto.
 * Mantém a latência para o estado de "a carregar" do botão ser visível.
 */
function mock<T>(resposta: ApiResponse<T>): Promise<ApiResponse<T>> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(resposta), 700)
  );
}

/** `true` enquanto o backend real não estiver disponível. */
const MODO_MOCK = !process.env.NEXT_PUBLIC_API_URL;

/** Cria uma conta nova. */
export async function registar(
  payload: RegisterPayload
): Promise<ApiResponse<{ id: string }>> {
  if (MODO_MOCK) {
    return mock({
      ok: true,
      success: true,
      message: `Pronto, ${payload.nome.trim()}! A sua conta foi criada. Já pode entrar com o seu número.`,
      data: { id: "mock-1" },
    });
  }
  return post<{ id: string }>("/auth/register", payload);
}

/** Inicia sessão. */
export async function entrar(
  payload: LoginPayload
): Promise<ApiResponse<{ token: string }>> {
  if (MODO_MOCK) {
    return mock({
      ok: true,
      success: true,
      message: "Bom te ver de novo! A entrar no seu caderno da terra...",
      data: { token: "mock-token" },
    });
  }
  return post<{ token: string }>("/auth/login", payload);
}
