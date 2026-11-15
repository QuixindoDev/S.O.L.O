/**
 * Todos os endpoints do back-end Field Shift, num sítio só.
 *
 * Cada função devolve o objecto já normalizado — o resto da aplicação
 * nunca precisa de saber o formato HTTP.
 *
 * As funções aceitam `token` para as rotas privadas (Bearer JWT).
 */

import { API_PATHS } from "./config";
import { apiFetch, type ApiFetchOptions } from "./http";
import type {
  AgronomistMessageDto,
  AnalyzePayload,
  AuthTokenDto,
  CropsCatalogDto,
  DiagnosticoDto,
  FarmerDto,
  FarmProfileDto,
  FinancialSummaryDto,
  FinancialTransactionDto,
  FinancialTransactionPayload,
  HarvestCreatePayload,
  HarvestDto,
  HortaOverviewDto,
  LoginPayload,
  PlantCreatePayload,
  PlantDto,
  PlantUpdatePayload,
  PlotCreatePayload,
  PlotDto,
  RegisterPayload,
  RegisterResponseDto,
  UserProfileDto,
  VerifyOtpPayload,
} from "./types";
import type { NasaPowerResponse } from "@/types/nasa";

type Options = Omit<ApiFetchOptions, "method" | "body" | "query">;

export const api = {
  /* ---------------------------------------------------------------------- */
  /* NASA                                                                   */
  /* ---------------------------------------------------------------------- */
  nasa: {
    /** Série diária da NASA POWER (temperatura, chuva, humidade, radiação). */
    power(
      params: { lat: number; lon: number; start?: string; end?: string },
      options: Options = {},
    ) {
      return apiFetch<NasaPowerResponse>(API_PATHS.nasaPower, {
        ...options,
        query: {
          lat: params.lat,
          lon: params.lon,
          start: params.start,
          end: params.end,
        },
      });
    },

    /** Humidade do solo (GWETTOP / GWETROOT). */
    soilMoisture(
      params: { lat: number; lon: number; start?: string; end?: string },
      options: Options = {},
    ) {
      return apiFetch<Record<string, unknown>>(API_PATHS.nasaSmaps, {
        ...options,
        query: {
          lat: params.lat,
          lon: params.lon,
          start: params.start,
          end: params.end,
        },
      });
    },
  },

  /* ---------------------------------------------------------------------- */
  /* Propriedade                                                           */
  /* ---------------------------------------------------------------------- */
  profile: {
    /** Perfil da propriedade (dono, terra, coordenadas). */
    get(options: Options = {}) {
      return apiFetch<FarmProfileDto>(API_PATHS.profile, options);
    },
  },

  /* ---------------------------------------------------------------------- */
  /* Horta, canteiros, plantas e colheitas                                 */
  /* ---------------------------------------------------------------------- */
  horta: {
    /** Visão geral: canteiros + plantas + colheitas. */
    overview(options: Options = {}) {
      return apiFetch<HortaOverviewDto>(API_PATHS.horta, options);
    },
  },

  plots: {
    list(options: Options = {}) {
      return apiFetch<PlotDto[]>(API_PATHS.plots, options);
    },
    create(payload: PlotCreatePayload, options: Options = {}) {
      return apiFetch<PlotDto>(API_PATHS.plots, {
        ...options,
        method: "POST",
        body: payload,
        noStore: true,
      });
    },
    remove(plotRef: string, options: Options = {}) {
      return apiFetch<{ mensagem: string; uuid: string }>(
        `${API_PATHS.plots}/${plotRef}`,
        { ...options, method: "DELETE", noStore: true },
      );
    },
  },

  plants: {
    list(plotId?: string, options: Options = {}) {
      return apiFetch<PlantDto[]>(API_PATHS.plants, {
        ...options,
        query: { plot_id: plotId },
      });
    },
    create(payload: PlantCreatePayload, options: Options = {}) {
      return apiFetch<PlantDto>(API_PATHS.plants, {
        ...options,
        method: "POST",
        body: payload,
        noStore: true,
      });
    },
    update(
      plantRef: string,
      payload: PlantUpdatePayload,
      options: Options = {},
    ) {
      return apiFetch<PlantDto>(`${API_PATHS.plants}/${plantRef}`, {
        ...options,
        method: "PATCH",
        body: payload,
        noStore: true,
      });
    },
    remove(plantRef: string, options: Options = {}) {
      return apiFetch<{ mensagem: string; uuid: string }>(
        `${API_PATHS.plants}/${plantRef}`,
        { ...options, method: "DELETE", noStore: true },
      );
    },
  },

  harvests: {
    list(options: Options = {}) {
      return apiFetch<HarvestDto[]>(API_PATHS.harvests, options);
    },
    create(payload: HarvestCreatePayload, options: Options = {}) {
      return apiFetch<HarvestDto>(API_PATHS.harvests, {
        ...options,
        method: "POST",
        body: payload,
        noStore: true,
      });
    },
  },

  /* ---------------------------------------------------------------------- */
  /* Caderninho de contas e agrônoma                                        */
  /* ---------------------------------------------------------------------- */
  finance: {
    summary(options: Options = {}) {
      return apiFetch<FinancialSummaryDto>(API_PATHS.financeSummary, options);
    },
    transactions(options: Options = {}) {
      return apiFetch<FinancialTransactionDto[]>(
        API_PATHS.financeTransactions,
        options,
      );
    },
    createTransaction(
      payload: FinancialTransactionPayload,
      options: Options = {},
    ) {
      return apiFetch<FinancialTransactionDto>(API_PATHS.financeTransactions, {
        ...options,
        method: "POST",
        body: payload,
        noStore: true,
      });
    },
  },

  agronomist: {
    messages(options: Options = {}) {
      return apiFetch<AgronomistMessageDto[]>(API_PATHS.agronomistMessages, options);
    },
    send(message: string, options: Options = {}) {
      return apiFetch<AgronomistMessageDto>(API_PATHS.agronomistMessages, {
        ...options,
        method: "POST",
        body: { message },
        noStore: true,
      });
    },
  },

  /* ---------------------------------------------------------------------- */
  /* Agricultores, análises e carbono                                       */
  /* ---------------------------------------------------------------------- */
  farmers: {
    list(
      params: { limit?: number; offset?: number; include_inactive?: boolean } = {},
      options: Options = {},
    ) {
      return apiFetch<FarmerDto[]>(API_PATHS.farmers, {
        ...options,
        query: {
          limit: params.limit,
          offset: params.offset,
          include_inactive: params.include_inactive ? "true" : undefined,
        },
      });
    },
    get(farmerUuid: string, options: Options = {}) {
      return apiFetch<FarmerDto>(`${API_PATHS.farmers}/${farmerUuid}`, options);
    },
    analyses(farmerUuid: string, options: Options = {}) {
      return apiFetch<DiagnosticoDto[]>(
        `${API_PATHS.farmers}/${farmerUuid}/analyses`,
        options,
      );
    },
    deactivate(farmerUuid: string, options: Options = {}) {
      return apiFetch<{ mensagem: string; uuid: string; is_active: boolean }>(
        `${API_PATHS.farmers}/${farmerUuid}/deactivate`,
        { ...options, method: "PATCH", noStore: true },
      );
    },
  },

  analyses: {
    list(options: Options = {}) {
      return apiFetch<DiagnosticoDto[]>(API_PATHS.analyses, options);
    },
    get(uuid: string, options: Options = {}) {
      return apiFetch<DiagnosticoDto>(`${API_PATHS.analyses}/${uuid}`, options);
    },
    analyze(payload: AnalyzePayload, options: Options = {}) {
      return apiFetch<DiagnosticoDto>(API_PATHS.analyze, {
        ...options,
        method: "POST",
        body: payload,
        noStore: true,
        timeoutMs: 60_000,
      });
    },
  },

  crops: {
    catalog(options: Options = {}) {
      return apiFetch<CropsCatalogDto>(API_PATHS.crops, options);
    },
  },

  carbon: {
    info(options: Options = {}) {
      return apiFetch<Record<string, unknown>>(API_PATHS.carbonInfo, options);
    },
  },

  /* ---------------------------------------------------------------------- */
  /* Autenticação                                                           */
  /* ---------------------------------------------------------------------- */
  auth: {
    register(payload: RegisterPayload, options: Options = {}) {
      return apiFetch<RegisterResponseDto>(API_PATHS.authRegister, {
        ...options,
        method: "POST",
        body: payload,
        noStore: true,
      });
    },
    verifyOtp(payload: VerifyOtpPayload, options: Options = {}) {
      return apiFetch<AuthTokenDto>(API_PATHS.authVerifyOtp, {
        ...options,
        method: "POST",
        body: payload,
        noStore: true,
      });
    },
    resendOtp(
      payload: { telefone?: string; farmer_uuid?: string },
      options: Options = {},
    ) {
      return apiFetch<RegisterResponseDto>(API_PATHS.authResendOtp, {
        ...options,
        method: "POST",
        body: payload,
        noStore: true,
      });
    },
    login(payload: LoginPayload, options: Options = {}) {
      return apiFetch<AuthTokenDto>(API_PATHS.authLogin, {
        ...options,
        method: "POST",
        body: payload,
        noStore: true,
      });
    },
    me(options: Options = {}) {
      return apiFetch<UserProfileDto>(API_PATHS.authMe, options);
    },
    logout(options: Options = {}) {
      return apiFetch<{ mensagem: string }>(API_PATHS.authLogout, {
        ...options,
        method: "POST",
        noStore: true,
      });
    },
  },

  /* ---------------------------------------------------------------------- */
  /* Saúde                                                                  */
  /* ---------------------------------------------------------------------- */
  health(options: Options = {}) {
    return apiFetch<{
      status: string;
      servico: string;
      versao: string;
      satelite_adapter: string;
      gee_autenticado: boolean;
      banco_dados: string;
    }>(API_PATHS.health, options);
  },
};

export type Api = typeof api;
