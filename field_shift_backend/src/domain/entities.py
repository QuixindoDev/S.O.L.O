"""
Módulo de Entidades de Domínio - Field Shift
Representa os modelos centrais de negócio puros, sem acoplamento a frameworks externos.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
import uuid


@dataclass
class Coordenadas:
    """Representa coordenadas geográficas de um ponto ou polígono."""
    latitude: float
    longitude: float
    poligono: Optional[List[Tuple[float, float]]] = None

    def __post_init__(self):
        if not (-90.0 <= self.latitude <= 90.0):
            raise ValueError(f"Latitude inválida: {self.latitude}. Deve estar entre -90 e 90.")
        if not (-180.0 <= self.longitude <= 180.0):
            raise ValueError(f"Longitude inválida: {self.longitude}. Deve estar entre -180 e 180.")


@dataclass
class Fazenda:
    """Entidade que representa a propriedade agrícola em análise."""
    latitude: float
    longitude: float
    area_hectares: float
    cultura_atual: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    nome: Optional[str] = None
    localizacao_descricao: Optional[str] = None
    poligono: Optional[List[Tuple[float, float]]] = None

    def __post_init__(self):
        if self.area_hectares <= 0:
            raise ValueError("A área em hectares deve ser superior a zero.")
        if not self.cultura_atual or not self.cultura_atual.strip():
            raise ValueError("A cultura atual declarada não pode estar vazia.")
        # Normalizar strings
        self.cultura_atual = self.cultura_atual.strip().title()


@dataclass
class MetricasSatelite:
    """Métricas biofísicas brutas obtidas via satélite (NASA POWER, GEE, etc.)."""
    ndvi: float
    humidade_solo: float
    precipitacao: float
    elevacao: float
    temperatura_media: Optional[float] = None
    umidade_relativa: Optional[float] = None
    fonte_dados: str = "NASA POWER / GEE"
    coletado_em: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class AnaliseSolo:
    """Diagnóstico consolidado da saúde do solo."""
    score_saude: float
    classificacao_saude: str
    indice_ndvi: float
    humidade_solo: float
    precipitacao_anual: float
    elevacao_metros: float
    risco_erosao: str
    diagnostico_detalhado: str

    def __post_init__(self):
        if not (0.0 <= self.score_saude <= 100.0):
            raise ValueError(f"Score de saúde deve estar entre 0 e 100, recebido: {self.score_saude}")


@dataclass
class RecomendacaoRotacao:
    """Sugestão técnica agronómica de cultura para rotação regenerativa."""
    cultura_recomendada: str
    nome_cientifico: Optional[str]
    justificativa: str
    beneficio_ecologico: str
    taxa_sequestro_adicional: float  # t C / ha / ano
    compatibilidade_clima: str


@dataclass
class EstimativaCarbono:
    """
    Cálculo de créditos de carbono voluntários gerados por práticas regenerativas.
    Fórmula: Créditos líquidos = (Hectares × Taxa de Sequestro × 3.67) × (1 - Margem de Segurança)
    """
    area_hectares: float
    taxa_sequestro: float  # t C / ha / ano
    fator_conversao_co2: float = 3.67  # Razão molecular CO2 / C (44/12)
    margem_seguranca: float = 0.20  # Margem de incerteza / buffer pool (20%)
    preco_por_credito_usd: float = 20.0  # Preço médio de mercado voluntário por tCO2e
    emissao_bruta_tco2e: float = 0.0
    creditos_liquidos_tco2e: float = 0.0
    valor_estimado_usd: float = 0.0

    def __post_init__(self):
        self.emissao_bruta_tco2e = round(self.area_hectares * self.taxa_sequestro * self.fator_conversao_co2, 2)
        self.creditos_liquidos_tco2e = round(self.emissao_bruta_tco2e * (1.0 - self.margem_seguranca), 2)
        self.valor_estimado_usd = round(self.creditos_liquidos_tco2e * self.preco_por_credito_usd, 2)


@dataclass
class DiagnosticoCompleto:
    """Resultado agregado retornado para a camada de aplicação e frontend."""
    id: str
    fazenda: Fazenda
    metricas_satelite: MetricasSatelite
    analise_solo: AnaliseSolo
    rotacao_principal: RecomendacaoRotacao
    alternativas_rotacao: List[RecomendacaoRotacao]
    estimativa_carbono: EstimativaCarbono
    gerado_em: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "gerado_em": self.gerado_em.isoformat(),
            "fazenda": {
                "id": self.fazenda.id,
                "nome": self.fazenda.nome,
                "latitude": self.fazenda.latitude,
                "longitude": self.fazenda.longitude,
                "area_hectares": self.fazenda.area_hectares,
                "cultura_atual": self.fazenda.cultura_atual,
                "localizacao_descricao": self.fazenda.localizacao_descricao,
            },
            "metricas_satelite": {
                "ndvi": self.metricas_satelite.ndvi,
                "humidade_solo": self.metricas_satelite.humidade_solo,
                "precipitacao": self.metricas_satelite.precipitacao,
                "elevacao": self.metricas_satelite.elevacao,
                "temperatura_media": self.metricas_satelite.temperatura_media,
                "fonte_dados": self.metricas_satelite.fonte_dados,
            },
            "analise_solo": {
                "score_saude": self.analise_solo.score_saude,
                "classificacao_saude": self.analise_solo.classificacao_saude,
                "indice_ndvi": self.analise_solo.indice_ndvi,
                "humidade_solo": self.analise_solo.humidade_solo,
                "precipitacao_anual": self.analise_solo.precipitacao_anual,
                "elevacao_metros": self.analise_solo.elevacao_metros,
                "risco_erosao": self.analise_solo.risco_erosao,
                "diagnostico_detalhado": self.analise_solo.diagnostico_detalhado,
            },
            "rotacao_principal": {
                "cultura_recomendada": self.rotacao_principal.cultura_recomendada,
                "nome_cientifico": self.rotacao_principal.nome_cientifico,
                "justificativa": self.rotacao_principal.justificativa,
                "beneficio_ecologico": self.rotacao_principal.beneficio_ecologico,
                "taxa_sequestro_adicional": self.rotacao_principal.taxa_sequestro_adicional,
                "compatibilidade_clima": self.rotacao_principal.compatibilidade_clima,
            },
            "alternativas_rotacao": [
                {
                    "cultura_recomendada": alt.cultura_recomendada,
                    "nome_cientifico": alt.nome_cientifico,
                    "justificativa": alt.justificativa,
                    "beneficio_ecologico": alt.beneficio_ecologico,
                    "taxa_sequestro_adicional": alt.taxa_sequestro_adicional,
                    "compatibilidade_clima": alt.compatibilidade_clima,
                }
                for alt in self.alternativas_rotacao
            ],
            "estimativa_carbono": {
                "area_hectares": self.estimativa_carbono.area_hectares,
                "taxa_sequestro": self.estimativa_carbono.taxa_sequestro,
                "fator_conversao_co2": self.estimativa_carbono.fator_conversao_co2,
                "margem_seguranca": self.estimativa_carbono.margem_seguranca,
                "emissao_bruta_tco2e": self.estimativa_carbono.emissao_bruta_tco2e,
                "creditos_liquidos_tco2e": self.estimativa_carbono.creditos_liquidos_tco2e,
                "preco_por_credito_usd": self.estimativa_carbono.preco_por_credito_usd,
                "valor_estimado_usd": self.estimativa_carbono.valor_estimado_usd,
            },
        }
