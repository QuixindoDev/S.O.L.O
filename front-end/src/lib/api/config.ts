/**
 * Endereço do back-end Field Shift.
 *
 * O front-end nunca chama a NASA directamente: passa sempre pelo
 * back-end, que normaliza, cacheia e protege o telemóvel da Dona Maria.
 *
 * Variáveis de ambiente (ver `front-end/.env.local`):
 *   NEXT_PUBLIC_API_URL=http://localhost:8000
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:8000"
).replace(/\/+$/, "");

/** Caminhos da API — a fonte única de verdade dos endpoints. */
export const API_PATHS = {
  health: "/health",
  profile: "/api/v1/profile",
  crops: "/api/v1/crops",
  carbonInfo: "/api/v1/carbon-calculator-info",

  farmers: "/api/v1/farmers",
  analyses: "/api/v1/analyses",
  analyze: "/api/v1/analyze",

  horta: "/api/v1/horta",
  plots: "/api/v1/plots",
  plants: "/api/v1/plants",
  harvests: "/api/v1/harvests",
  financeSummary: "/api/v1/finance/summary",
  financeTransactions: "/api/v1/finance/transactions",
  agronomistMessages: "/api/v1/agronomist/messages",

  authRegister: "/api/v1/auth/register",
  authVerifyOtp: "/api/v1/auth/verify-otp",
  authResendOtp: "/api/v1/auth/resend-otp",
  authLogin: "/api/v1/auth/login",
  authMe: "/api/v1/auth/me",
  authLogout: "/api/v1/auth/logout",

  nasaPower: "/api/nasa/power",
  nasaSmaps: "/api/nasa/smap",
} as const;

/** URL completa de um endpoint do back-end. */
export function apiUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}
