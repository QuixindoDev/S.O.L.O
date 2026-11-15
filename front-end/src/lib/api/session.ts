/**
 * Sessão do agricultor — token Bearer do back-end.
 *
 * O token vive em dois sítio ao mesmo tempo:
 *  - `localStorage` — para os pedidos feitos no browser (componentes
 *    "use client");
 *  - um cookie simples — para os Server Components poderem enviar o
 *    token sem JavaScript.
 *
 * O cookie não é `httpOnly` porque é escrito por JavaScript; num
 * projecto de produção o login deve ser feito por Route Handler no
 * servidor, que então o escreve como `httpOnly`.
 */

const TOKEN_KEY = "solo.access_token";
const COOKIE_NAME = "solo_token";

/** Guarda o token (após login ou verificação 2FA). */
export function saveSession(token: string): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Sem espaço no dispositivo — o cookie ainda permite sessão.
  }

  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
}

/** Token da sessão actual (browser). */
export function readSessionToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (stored) return stored;
  } catch {
    // Ignora erros de storage.
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** Termina a sessão local. */
export function clearSession(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignora erros de storage.
  }

  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
