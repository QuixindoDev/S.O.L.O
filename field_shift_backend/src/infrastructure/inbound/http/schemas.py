"""
Esquemas Pydantic para Validação de Entrada e Saída da API HTTP - Field Shift
"""

from typing import List, Optional, Tuple
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class FazendaCreateRequest(BaseModel):
    """Payload de entrada para solicitação de análise de solo e cálculo de carbono."""
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
    nome: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Nome opcional da fazenda ou produtor",
        examples=["Talhão Esperança - Huambo"]
    )
    localizacao_descricao: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Descrição regional (ex: Huambo, Angola)",
        examples=["Huambo, Planalto Central, Angola"]
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


class FazendaResponse(BaseModel):
    id: str
    nome: Optional[str]
    latitude: float
    longitude: float
    area_hectares: float
    cultura_atual: str
    localizacao_descricao: Optional[str]


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
    id: str
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
