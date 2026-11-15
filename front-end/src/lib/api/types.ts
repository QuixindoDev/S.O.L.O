/**
 * Tipos do contrato com o back-end Field Shift.
 *
 * Espelham os schemas Pydantic de
 * `back-end/src/infrastructure/inbound/http/schemas.py`.
 */

import type { NasaPowerResponse } from "@/types/nasa";
import type { SoilTextureType } from "@/types/agronomy";

/* -------------------------------------------------------------------------- */
/* Propriedade                                                                */
/* -------------------------------------------------------------------------- */

export interface FarmProfileDto {
  id: string;
  uuid: string;
  userName: string;
  farmName: string;
  city: string;
  state: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  soil: SoilTextureType;
  areaHectares: number;
  phone: string;
  cooperativa?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Horta, canteiros, plantas e colheitas                                      */
/* -------------------------------------------------------------------------- */

export interface PlotDto {
  id: string;
  uuid?: string | null;
  name: string;
  crops?: string | null;
  areaM2: number;
  icon: string;
  soilTexture?: string | null;
}

export interface PlantDto {
  id: string;
  uuid?: string | null;
  plotId: string;
  name: string;
  icon: string;
  care?: string | null;
  status: string;
  tone: string;
  sowingDate?: string | null;
  harvestInDays: number;
}

export interface HarvestDto {
  id: string;
  uuid?: string | null;
  crop: string;
  quantity: string;
  soldAt: string;
  date: string;
}

export interface HortaOverviewDto {
  canteiros: PlotDto[];
  plantas: PlantDto[];
  colheitas: HarvestDto[];
}

export interface PlotCreatePayload {
  name: string;
  crops?: string;
  areaM2?: number;
  icon?: string;
  soilTexture?: string;
}

export interface PlantCreatePayload {
  name: string;
  plotId: string;
  icon?: string;
  care?: string;
  status?: string;
  tone?: string;
  sowingDate?: string;
  harvestInDays?: number;
}

export interface PlantUpdatePayload {
  status?: string;
  care?: string;
  tone?: string;
  harvestInDays?: number;
}

export interface HarvestCreatePayload {
  crop: string;
  quantity: string;
  soldAt?: string;
  date?: string;
}

/* -------------------------------------------------------------------------- */
/* Finanças e agrônoma                                                        */
/* -------------------------------------------------------------------------- */

export interface FinancialTransactionDto {
  id: string;
  uuid?: string | null;
  tipo: string;
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
}

export interface FinancialSummaryDto {
  mes: string;
  dinheiroQueEntrou: number;
  dinheiroQueSaiu: number;
  sobrou: number;
  transacoes: FinancialTransactionDto[];
}

export interface FinancialTransactionPayload {
  tipo: "entrada" | "saida";
  categoria: string;
  descricao: string;
  valor: number;
  data?: string;
}

export interface AgronomistMessageDto {
  id: string;
  uuid?: string | null;
  sender: string;
  senderName: string;
  message: string;
  isRead: boolean;
  time: string;
}

/* -------------------------------------------------------------------------- */
/* Agricultores, análises e carbono                                            */
/* -------------------------------------------------------------------------- */

export interface FarmerDto {
  id: string;
  uuid?: string | null;
  nome_completo: string;
  telefone: string;
  cooperativa?: string | null;
  bilhete_identidade_ou_codigo?: string | null;
  is_active: boolean;
  criado_em?: string | null;
}

export interface DiagnosticoDto {
  id: string;
  uuid?: string | null;
  farmer_uuid?: string | null;
  gerado_em: string;
  fazenda: {
    id: string;
    uuid?: string | null;
    farmer_uuid?: string | null;
    nome?: string | null;
    latitude: number;
    longitude: number;
    area_hectares: number;
    cultura_atual: string;
    localizacao_descricao?: string | null;
  };
  metricas_satelite: {
    ndvi: number;
    humidade_solo: number;
    precipitacao: number;
    elevacao: number;
    temperatura_media?: number | null;
    fonte_dados: string;
  };
  analise_solo: {
    score_saude: number;
    classificacao_saude: string;
    indice_ndvi: number;
    humidade_solo: number;
    precipitacao_anual: number;
    elevacao_metros: number;
    risco_erosao: string;
    diagnostico_detalhado: string;
  };
  rotacao_principal: {
    cultura_recomendada: string;
    nome_cientifico?: string | null;
    justificativa: string;
    beneficio_ecologico: string;
    taxa_sequestro_adicional: number;
    compatibilidade_clima: string;
  };
  alternativas_rotacao: Array<DiagnosticoDto["rotacao_principal"]>;
  estimativa_carbono: {
    area_hectares: number;
    taxa_sequestro: number;
    fator_conversao_co2: number;
    margem_seguranca: number;
    emissao_bruta_tco2e: number;
    creditos_liquidos_tco2e: number;
    preco_por_credito_usd: number;
    valor_estimado_usd: number;
  };
}

export interface AnalyzePayload {
  latitude: number;
  longitude: number;
  area_hectares: number;
  cultura_atual: string;
  farmer_uuid?: string;
  nome?: string;
  localizacao_descricao?: string;
  margem_seguranca?: number;
  preco_carbono_usd?: number;
}

export interface CropsCatalogDto {
  culturas_base: Array<{
    nome: string;
    caracteristica: string;
    risco_monocultura: string;
  }>;
  leguminosas_regenerativas: Array<{
    nome: string;
    nome_cientifico: string;
    funcao: string;
    taxa_sequestro_media: string;
  }>;
}

/* -------------------------------------------------------------------------- */
/* Autenticação                                                               */
/* -------------------------------------------------------------------------- */

export interface RegisterPayload {
  nome_completo: string;
  telefone: string;
  senha: string;
  apelido?: string;
  cidade_estado?: string;
  cidade?: string;
  estado?: string;
  nome_sitio?: string;
  tipo_solo?: string;
  cooperativa?: string;
}

export interface RegisterResponseDto {
  mensagem: string;
  farmer_uuid: string;
  telefone_mascarado: string;
  sms_enviado: boolean;
  proximo_passo: string;
  otp_debug?: string | null;
}

export interface LoginPayload {
  telefone: string;
  senha: string;
}

export interface UserProfileDto {
  id: string;
  uuid: string;
  userName: string;
  farmName: string;
  userInitials: string;
  city: string;
  state: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  soil: SoilTextureType;
  phone: string;
  isPhoneVerified: boolean;
  cooperativa?: string | null;
}

export interface AuthTokenDto {
  access_token: string;
  token_type: string;
  expires_in: number;
  usuario: UserProfileDto;
}

export interface VerifyOtpPayload {
  codigo_otp: string;
  telefone?: string;
  farmer_uuid?: string;
}

/* -------------------------------------------------------------------------- */
/* NASA                                                                       */
/* -------------------------------------------------------------------------- */

export type { NasaPowerResponse };
