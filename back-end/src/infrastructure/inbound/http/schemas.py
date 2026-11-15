"""
Esquemas Pydantic v2 para Validação de Entrada e Saída da API HTTP - Field Shift
Garante o isolamento e serialização utilizando exclusivamente UUIDs para interfaces externas.
Suporta a entidade Agricultor (Farmer) e a relação 1:N com análises de terras.
"""

import uuid
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


# ==============================================================================
# SCHEMAS DE AGRICULTORES (FARMERS)
# ==============================================================================

class FarmerCreateRequest(BaseModel):
    """Payload para registar um novo agricultor familiar."""
    nome_completo: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Nome completo do agricultor familiar",
        examples=["Manuel Domingos Kaputu"]
    )
    telefone: str = Field(
        ...,
        min_length=5,
        max_length=50,
        description="Telefone de contacto (essencial para pagamentos móveis em Angola)",
        examples=["+244 923 456 789"]
    )
    cooperativa: Optional[str] = Field(
        default=None,
        max_length=150,
        description="Cooperativa ou associação agrícola à qual pertence",
        examples=["Cooperativa Agrícola do Huambo"]
    )
    bilhete_identidade_ou_codigo: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Identificação oficial local ou código da cooperativa",
        examples=["005829102HA042"]
    )
    uuid: Optional[str] = Field(
        default=None,
        description="UUID opcional gerado no cliente para suporte offline-first",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )

    @field_validator("nome_completo")
    @classmethod
    def validar_nome(cls, v: str) -> str:
        v_stripped = v.strip()
        if not v_stripped:
            raise ValueError("O nome do agricultor não pode estar em branco.")
        return v_stripped

    @field_validator("telefone")
    @classmethod
    def validar_telefone(cls, v: str) -> str:
        v_stripped = v.strip()
        if not v_stripped:
            raise ValueError("O telefone não pode estar em branco.")
        return v_stripped

    @field_validator("uuid")
    @classmethod
    def validar_uuid_opcional(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v_clean = v.strip()
        if not v_clean:
            return None
        try:
            return str(uuid.UUID(v_clean))
        except ValueError:
            raise ValueError(f"O identificador '{v}' não é um UUID válido.")


class FarmerResponse(BaseModel):
    id: str = Field(description="UUID do agricultor")
    uuid: Optional[str] = Field(default=None, description="UUID do agricultor")
    nome_completo: str
    telefone: str
    cooperativa: Optional[str] = None
    bilhete_identidade_ou_codigo: Optional[str] = None
    is_active: bool = Field(default=True, description="Estado ativo do agricultor (Soft Delete)")
    criado_em: Optional[datetime] = None


class FarmerDeactivationResponse(BaseModel):
    """Resposta informativa para operações de desativação lógica (Soft Delete)."""
    mensagem: str = Field(
        default="Agricultor desativado com sucesso. Todo o histórico de terras e créditos de carbono foi preservado para fins de auditoria.",
        description="Mensagem informativa de confirmação e auditoria"
    )
    uuid: str = Field(description="UUID público do agricultor")
    is_active: bool = Field(default=False, description="Novo estado ativo do agricultor")
    agricultor: Optional[FarmerResponse] = Field(default=None, description="Dados cadastrais atualizados do agricultor")


# ==============================================================================
# SCHEMAS DE ANÁLISE DE TERRAS
# ==============================================================================

class FazendaCreateRequest(BaseModel):
    """
    Payload de entrada para solicitação de análise de solo e cálculo de carbono.
    Suporta envio opcional de UUIDs para sincronização em ambientes offline-first.
    """
    latitude: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Latitude decimal do terreno ou ponto central da fazenda",
        examples=[-12.776]
    )
    longitude: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Longitude decimal do terreno",
        examples=[15.734]
    )
    area_hectares: float = Field(
        ...,
        gt=0.0,
        description="Área cultivada total da fazenda em hectares",
        examples=[4.5]
    )
    cultura_atual: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Nome da cultura atualmente plantada (ex: Milho, Mandioca, Massango, Algodão)",
        examples=["Milho"]
    )
    farmer_uuid: Optional[str] = Field(
        default=None,
        description="UUID do agricultor proprietário da parcela",
        examples=["456e7890-e89b-12d3-a456-426614174000"]
    )
    nome: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Nome opcional da fazenda ou talhão",
        examples=["Talhão Esperança - Huambo"]
    )
    localizacao_descricao: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Descrição regional (ex: Huambo, Angola)",
        examples=["Huambo, Planalto Central, Angola"]
    )
    uuid: Optional[str] = Field(
        default=None,
        description="UUID único da análise gerado no cliente (para suporte offline-first)",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )
    fazenda_uuid: Optional[str] = Field(
        default=None,
        description="UUID único da fazenda gerado no cliente (para suporte offline-first)",
        examples=["987fcdeb-51a2-43f7-9876-543210987654"]
    )
    margem_seguranca: Optional[float] = Field(
        default=0.20,
        ge=0.0,
        le=0.50,
        description="Fator de reserva de incerteza / buffer pool (padrão de mercado: 0.20 = 20%)"
    )
    preco_carbono_usd: Optional[float] = Field(
        default=20.0,
        gt=0.0,
        description="Cotação de mercado voluntário por tonelada de CO2e em USD (padrão: $20.00)"
    )

    @field_validator("cultura_atual")
    @classmethod
    def validar_cultura(cls, v: str) -> str:
        v_stripped = v.strip()
        if not v_stripped:
            raise ValueError("O nome da cultura atual não pode ser vazio.")
        return v_stripped.title()

    @field_validator("uuid", "fazenda_uuid", "farmer_uuid")
    @classmethod
    def validar_uuid_opcional(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v_clean = v.strip()
        if not v_clean:
            return None
        try:
            return str(uuid.UUID(v_clean))
        except ValueError:
            raise ValueError(f"O identificador '{v}' não é um UUID válido.")


class FazendaResponse(BaseModel):
    id: str = Field(description="UUID da propriedade agrícola")
    uuid: Optional[str] = Field(default=None, description="UUID da propriedade agrícola")
    farmer_uuid: Optional[str] = Field(default=None, description="UUID do agricultor proprietário")
    nome: Optional[str] = None
    latitude: float
    longitude: float
    area_hectares: float
    cultura_atual: str
    localizacao_descricao: Optional[str] = None


class MetricasSateliteResponse(BaseModel):
    ndvi: float = Field(description="Índice de Vegetação por Diferença Normalizada (-1 a 1)")
    humidade_solo: float = Field(description="Fração volumétrica de humidade superficial (0 a 1)")
    precipitacao: float = Field(description="Precipitação anual média estimada (mm)")
    elevacao: float = Field(description="Elevação topográfica SRTM em metros")
    temperatura_media: Optional[float] = Field(default=None, description="Temperatura média anual em °C")
    fonte_dados: str = Field(description="Fonte espacial das métricas biofísicas")


class AnaliseSoloResponse(BaseModel):
    score_saude: float = Field(description="Índice de saúde do solo de 0 a 100")
    classificacao_saude: str = Field(description="Classificação textual: Crítico, Degradado, Moderado, Bom, Excelente")
    indice_ndvi: float
    humidade_solo: float
    precipitacao_anual: float
    elevacao_metros: float
    risco_erosao: str = Field(description="Nível de risco: Baixo, Médio, Alto, Muito Alto")
    diagnostico_detalhado: str


class RecomendacaoRotacaoResponse(BaseModel):
    cultura_recomendada: str
    nome_cientifico: Optional[str]
    justificativa: str
    beneficio_ecologico: str
    taxa_sequestro_adicional: float = Field(description="Taxa de sequestro adicional em t C / ha / ano")
    compatibilidade_clima: str


class EstimativaCarbonoResponse(BaseModel):
    area_hectares: float
    taxa_sequestro: float = Field(description="Taxa de sequestro aplicada (t C / ha / ano)")
    fator_conversao_co2: float = Field(default=3.67, description="Razão estequiométrica CO2 / C")
    margem_seguranca: float = Field(description="Margem de segurança / buffer pool aplicada")
    emissao_bruta_tco2e: float = Field(description="CO2e bruto sequestrado por ano (Hectares × Taxa × 3.67)")
    creditos_liquidos_tco2e: float = Field(description="Créditos de carbono líquidos comercializáveis (tCO2e/ano)")
    preco_por_credito_usd: float = Field(description="Preço unitário por crédito em USD")
    valor_estimado_usd: float = Field(description="Rendimento anual potencial estimado em USD")


class DiagnosticoResponse(BaseModel):
    id: str = Field(description="UUID único da análise")
    uuid: Optional[str] = Field(default=None, description="UUID único da análise")
    farmer_uuid: Optional[str] = Field(default=None, description="UUID do agricultor associado")
    agricultor: Optional[FarmerResponse] = Field(default=None, description="Dados do agricultor associado")
    gerado_em: datetime
    fazenda: FazendaResponse
    metricas_satelite: MetricasSateliteResponse
    analise_solo: AnaliseSoloResponse
    rotacao_principal: RecomendacaoRotacaoResponse
    alternativas_rotacao: List[RecomendacaoRotacaoResponse]
    estimativa_carbono: EstimativaCarbonoResponse


class HealthResponse(BaseModel):
    status: str
    servico: str
    versao: str
    satelite_adapter: str
    gee_autenticado: bool
    banco_dados: str
