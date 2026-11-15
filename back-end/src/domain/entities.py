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
class Agricultor:
    """
    Entidade pura que representa o agricultor familiar ou produtor rural.
    Contém dados cadastrais essenciais para contacto e futuros pagamentos móveis em Angola.
    Suporta Soft Delete (Eliminação Lógica) através do campo is_active.
    """
    nome_completo: str
    telefone: str
    cooperativa: Optional[str] = None
    bilhete_identidade_ou_codigo: Optional[str] = None
    is_active: bool = True
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    criado_em: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    apelido: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    nome_sitio: Optional[str] = None
    latitude_padrao: Optional[float] = -12.97
    longitude_padrao: Optional[float] = -39.51
    tipo_solo: Optional[str] = "argiloso"
    is_phone_verified: bool = False

    def __post_init__(self):
        if not self.nome_completo or not self.nome_completo.strip():
            raise ValueError("O nome completo do agricultor não pode estar vazio.")
        if not self.telefone or not self.telefone.strip():
            raise ValueError("O telefone do agricultor é obrigatório para notificações e pagamentos móveis.")
        self.nome_completo = self.nome_completo.strip()
        self.telefone = self.telefone.strip()
        if self.cooperativa:
            self.cooperativa = self.cooperativa.strip()
        if self.bilhete_identidade_ou_codigo:
            self.bilhete_identidade_ou_codigo = self.bilhete_identidade_ou_codigo.strip()
        if self.apelido:
            self.apelido = self.apelido.strip()
        if self.cidade:
            self.cidade = self.cidade.strip()
        if self.estado:
            self.estado = self.estado.strip()
        if self.nome_sitio:
            self.nome_sitio = self.nome_sitio.strip()

    @property
    def uuid(self) -> str:
        """UUID público do agricultor."""
        return self.id

    def deactivate(self) -> None:
        """Desativa logicamente o agricultor, preservando o histórico de análises e carbono."""
        self.is_active = False

    def activate(self) -> None:
        """Reativa o agricultor."""
        self.is_active = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "uuid": self.id,
            "nome_completo": self.nome_completo,
            "apelido": self.apelido,
            "telefone": self.telefone,
            "cooperativa": self.cooperativa,
            "bilhete_identidade_ou_codigo": self.bilhete_identidade_ou_codigo,
            "cidade": self.cidade,
            "estado": self.estado,
            "nome_sitio": self.nome_sitio,
            "latitude_padrao": self.latitude_padrao,
            "longitude_padrao": self.longitude_padrao,
            "tipo_solo": self.tipo_solo,
            "is_phone_verified": self.is_phone_verified,
            "is_active": self.is_active,
            "criado_em": self.criado_em.isoformat() if isinstance(self.criado_em, datetime) else str(self.criado_em),
        }


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
    farmer_uuid: Optional[str] = None

    def __post_init__(self):
        if self.area_hectares <= 0:
            raise ValueError("A área em hectares deve ser superior a zero.")
        if not self.cultura_atual or not self.cultura_atual.strip():
            raise ValueError("A cultura atual declarada não pode estar vazia.")
        # Normalizar strings
        self.cultura_atual = self.cultura_atual.strip().title()

    @property
    def uuid(self) -> str:
        """UUID público da fazenda."""
        return self.id


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
    agricultor: Optional[Agricultor] = None
    gerado_em: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def uuid(self) -> str:
        """UUID público da análise."""
        return self.id

    @property
    def farmer_uuid(self) -> Optional[str]:
        """UUID público do agricultor vinculado."""
        if self.agricultor:
            return self.agricultor.uuid
        return self.fazenda.farmer_uuid

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "uuid": self.id,
            "farmer_uuid": self.farmer_uuid,
            "agricultor": self.agricultor.to_dict() if self.agricultor else None,
            "gerado_em": self.gerado_em.isoformat(),
            "fazenda": {
                "id": self.fazenda.id,
                "uuid": self.fazenda.id,
                "nome": self.fazenda.nome,
                "latitude": self.fazenda.latitude,
                "longitude": self.fazenda.longitude,
                "area_hectares": self.fazenda.area_hectares,
                "cultura_atual": self.fazenda.cultura_atual,
                "localizacao_descricao": self.fazenda.localizacao_descricao,
                "farmer_uuid": self.farmer_uuid,
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


@dataclass
class Canteiro:
    """Representa um canteiro ou talhão da horta/propriedade."""
    nome: str
    farmer_uuid: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    slug: Optional[str] = None
    descricao_culturas: Optional[str] = None
    area_m2: float = 100.0
    icone: str = "sprout"
    textura_solo: str = "argiloso"
    criado_em: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def uuid(self) -> str:
        return self.id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "uuid": self.id,
            "farmer_uuid": self.farmer_uuid,
            "name": self.nome,
            "slug": self.slug,
            "crops": self.descricao_culturas,
            "areaM2": self.area_m2,
            "icon": self.icone,
            "soilTexture": self.textura_solo,
            "createdAt": self.criado_em.isoformat() if isinstance(self.criado_em, datetime) else str(self.criado_em),
        }


@dataclass
class Planta:
    """Representa uma planta/cultura cultivada em um canteiro."""
    nome: str
    plot_uuid: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    slug: Optional[str] = None
    icone: str = "sprout"
    status: str = "Crescendo"
    cuidados: Optional[str] = None
    tone: str = "neutral"
    data_plantio: Optional[str] = None
    colheita_em_dias: int = 0
    criado_em: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def uuid(self) -> str:
        return self.id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "uuid": self.id,
            "plotId": self.plot_uuid,
            "name": self.nome,
            "slug": self.slug,
            "icon": self.icone,
            "status": self.status,
            "care": self.cuidados,
            "tone": self.tone,
            "sowingDate": self.data_plantio,
            "harvestInDays": self.colheita_em_dias,
            "createdAt": self.criado_em.isoformat() if isinstance(self.criado_em, datetime) else str(self.criado_em),
        }


@dataclass
class Colheita:
    """Representa o registo de uma colheita efetuada."""
    cultura: str
    quantidade: str
    farmer_uuid: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    local_venda: str = "feira"
    data: str = field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y%m%d"))
    criado_em: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def uuid(self) -> str:
        return self.id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "uuid": self.id,
            "farmer_uuid": self.farmer_uuid,
            "crop": self.cultura,
            "quantity": self.quantidade,
            "soldAt": self.local_venda,
            "date": self.data,
            "createdAt": self.criado_em.isoformat() if isinstance(self.criado_em, datetime) else str(self.criado_em),
        }


@dataclass
class RegistroFinanceiro:
    """Representa um lançamento no Caderninho de Contas."""
    tipo: str  # "entrada" ou "saida"
    categoria: str
    descricao: str
    valor: float
    data: str
    farmer_uuid: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    criado_em: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def uuid(self) -> str:
        return self.id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "uuid": self.id,
            "farmer_uuid": self.farmer_uuid,
            "tipo": self.tipo,
            "categoria": self.categoria,
            "descricao": self.descricao,
            "valor": self.valor,
            "data": self.data,
            "createdAt": self.criado_em.isoformat() if isinstance(self.criado_em, datetime) else str(self.criado_em),
        }


@dataclass
class MensagemAgronoma:
    """Representa uma mensagem no canal de dúvidas com a agrônoma."""
    farmer_uuid: str
    remetente: str  # "farmer" ou "agronomist"
    nome_remetente: str
    mensagem: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    lida: bool = False
    criado_em: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def uuid(self) -> str:
        return self.id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "uuid": self.id,
            "farmer_uuid": self.farmer_uuid,
            "sender": self.remetente,
            "senderName": self.nome_remetente,
            "message": self.mensagem,
            "isRead": self.lida,
            "createdAt": self.criado_em.isoformat() if isinstance(self.criado_em, datetime) else str(self.criado_em),
        }
