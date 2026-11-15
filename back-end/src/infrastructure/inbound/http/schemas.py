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


# ==============================================================================
# SCHEMAS DE AUTENTICAÇÃO E 2FA (S.O.L.O. CAMPO AMIGO)
# ==============================================================================

class RegisterRequest(BaseModel):
    """Payload de cadastro do agricultor (Ecrã 1: Criar sua Conta Grátis)."""
    nome_completo: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Como você quer ser chamada? (Ex: Dona Maria da Silva ou Sítio Esperança)",
        examples=["Dona Maria da Silva"]
    )
    telefone: str = Field(
        ...,
        min_length=6,
        max_length=50,
        description="Seu WhatsApp ou Celular para receber alertas do tempo",
        examples=["(71) 99123-4567"]
    )
    senha: str = Field(
        ...,
        min_length=4,
        max_length=100,
        description="Crie uma Senha Simples (uma palavra ou números fáceis)",
        examples=["solo2026"]
    )
    apelido: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Apelido carinhoso ou nome curto",
        examples=["Dona Maria"]
    )
    cidade_estado: Optional[str] = Field(
        default=None,
        max_length=150,
        description="Sua Cidade e Estado (Ex: Feira de Santana - BA)",
        examples=["Feira de Santana - BA"]
    )
    cidade: Optional[str] = Field(default=None, max_length=100)
    estado: Optional[str] = Field(default=None, max_length=50)
    nome_sitio: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Nome do sítio ou roça",
        examples=["Sítio Recanto Verde"]
    )
    tipo_solo: Optional[str] = Field(
        default="argiloso",
        description="Textura do solo: arenoso | argiloso | franco",
        examples=["argiloso"]
    )
    cooperativa: Optional[str] = Field(default=None, max_length=150)

    @field_validator("nome_completo", "telefone", "senha")
    @classmethod
    def validar_obrigatorios(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("O campo não pode estar em branco.")
        return clean


class RegisterResponse(BaseModel):
    """Resposta ao cadastrar (redireciona para o Ecrã 2: SMS Enviado)."""
    mensagem: str = Field(default="Conta criada com sucesso! Enviamos um SMS com o código de verificação.")
    farmer_uuid: str
    telefone_mascarado: str
    sms_enviado: bool = True
    proximo_passo: str = Field(default="Digite o código de 6 números enviado por SMS.")
    otp_debug: Optional[str] = Field(default=None, description="Apenas em ambiente de desenvolvimento")


class LoginRequest(BaseModel):
    """Payload de entrada (Ecrã 1-B: Entrar na minha conta)."""
    telefone: str = Field(..., description="Seu WhatsApp ou Celular", examples=["(71) 99123-4567"])
    senha: str = Field(..., description="Sua Senha", examples=["solo2026"])

    @field_validator("telefone", "senha")
    @classmethod
    def validar_login(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("O telefone e a senha são obrigatórios.")
        return clean


class VerifyOtpRequest(BaseModel):
    """Payload de validação de 2FA (Ecrã 3: Verificação de Segurança)."""
    codigo_otp: str = Field(
        ...,
        min_length=6,
        max_length=6,
        description="Digite os 6 números do SMS",
        examples=["482910"]
    )
    telefone: Optional[str] = Field(default=None, description="Número de telefone vinculado")
    farmer_uuid: Optional[str] = Field(default=None, description="UUID do agricultor")

    @field_validator("codigo_otp")
    @classmethod
    def validar_codigo(cls, v: str) -> str:
        clean = v.strip()
        if not clean.isdigit() or len(clean) != 6:
            raise ValueError("O código de verificação deve conter exatamente 6 dígitos numéricos.")
        return clean


class ResendOtpRequest(BaseModel):
    """Payload para reenviar código SMS."""
    telefone: Optional[str] = Field(default=None)
    farmer_uuid: Optional[str] = Field(default=None)


class AuthTokenResponse(BaseModel):
    """Resposta com token Bearer JWT e perfil após login/2FA com sucesso."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: dict


class UserProfileResponse(BaseModel):
    """Perfil completo do agricultor compatível com Sidebar, TopBar e FarmProfile do front-end."""
    id: str
    uuid: str
    userName: str
    farmName: str
    userInitials: str
    city: str
    state: str
    locationLabel: str
    latitude: float
    longitude: float
    soil: str
    phone: str
    isPhoneVerified: bool
    cooperativa: Optional[str] = None


# ==============================================================================
# SCHEMAS DE NEGÓCIO: HORTA, PLANTAS, COLHEITAS, FINANÇAS E MENSAGENS
# ==============================================================================

class PlotCreateRequest(BaseModel):
    """Criação de um novo Canteiro na Horta."""
    name: str = Field(..., min_length=2, max_length=150, description="Nome do canteiro (Ex: Canteiro Principal)")
    crops: Optional[str] = Field(default=None, max_length=255, description="Culturas plantadas (Ex: Alface, Couve e Tomate Cereja)")
    areaM2: float = Field(default=100.0, gt=0, description="Área em m² do canteiro")
    icon: str = Field(default="sprout", description="Ícone: sprout | carrot | bean | leaf")
    soilTexture: Optional[str] = Field(default="argiloso", description="Textura do solo do canteiro")


class PlotResponse(BaseModel):
    """Estrutura do canteiro idêntica a horta.json do front-end."""
    id: str
    uuid: Optional[str] = None
    name: str
    crops: Optional[str] = None
    areaM2: float
    icon: str
    soilTexture: Optional[str] = "argiloso"


class PlantCreateRequest(BaseModel):
    """Cadastro de nova planta/cultura."""
    name: str = Field(..., min_length=2, max_length=150, description="Nome da planta (Ex: Tomate Cereja)")
    plotId: str = Field(..., description="ID ou UUID do canteiro onde está plantada")
    icon: str = Field(default="sprout", description="Ícone: sprout | leaf | bean | carrot")
    care: Optional[str] = Field(default=None, max_length=255, description="Cuidados atuais (Ex: Precisa de estaca agora)")
    status: str = Field(default="Crescendo", description="Status: Florindo | Pronta | Crescendo | Com sede | Cortando")
    tone: str = Field(default="neutral", description="Tom visual do badge: primary | neutral | danger")
    sowingDate: Optional[str] = Field(default=None, description="Data da semeadura (YYYYMMDD ou AAAA-MM-DD)")
    harvestInDays: int = Field(default=0, ge=0, description="Dias restantes estimados até a colheita")


class PlantUpdateRequest(BaseModel):
    """Atualização de status ou cuidados de uma planta."""
    status: Optional[str] = None
    care: Optional[str] = None
    tone: Optional[str] = None
    harvestInDays: Optional[int] = None


class PlantResponse(BaseModel):
    """Estrutura da planta idêntica a horta.json do front-end."""
    id: str
    uuid: Optional[str] = None
    plotId: str
    name: str
    icon: str
    care: Optional[str] = None
    status: str
    tone: str
    sowingDate: Optional[str] = None
    harvestInDays: int


class HarvestCreateRequest(BaseModel):
    """Registro de colheita efetuada."""
    crop: str = Field(..., min_length=2, max_length=150, description="Cultura colhida (Ex: Alface)")
    quantity: str = Field(..., min_length=1, max_length=100, description="Quantidade colhida (Ex: 12 cabeças, 8 kg)")
    soldAt: str = Field(default="feira", description="Destino: feira | casa | cooperativa")
    date: Optional[str] = Field(default=None, description="Data da colheita (YYYYMMDD)")


class HarvestResponse(BaseModel):
    """Estrutura da colheita idêntica a horta.json do front-end."""
    id: str
    uuid: Optional[str] = None
    crop: str
    quantity: str
    soldAt: str
    date: str


class HortaOverviewResponse(BaseModel):
    """Estrutura completa equivalente a horta.json para consumo direto do front-end."""
    canteiros: List[PlotResponse]
    plantas: List[PlantResponse]
    colheitas: List[HarvestResponse]


class FinancialTransactionCreateRequest(BaseModel):
    """Lançamento no Caderninho de Contas (Ecrã 9)."""
    tipo: str = Field(..., description="Tipo de movimentação: entrada (venda) ou saida (gasto)")
    categoria: str = Field(..., description="Categoria: feira | adubo | sementes | agua | outros")
    descricao: str = Field(..., min_length=2, max_length=255, description="Descrição da conta (Ex: Venda de alface na feira)")
    valor: float = Field(..., gt=0, description="Valor monetário (R$ ou Kz)")
    data: Optional[str] = Field(default=None, description="Data do lançamento (Ex: '12 de nov' ou '2026-11-12')")


class FinancialTransactionResponse(BaseModel):
    """Registro individual de movimentação financeira."""
    id: str
    uuid: Optional[str] = None
    tipo: str
    categoria: str
    descricao: str
    valor: float
    data: str


class FinancialSummaryResponse(BaseModel):
    """Resumo do mês para os cards principais do Caderninho de Contas."""
    mes: str
    dinheiroQueEntrou: float
    dinheiroQueSaiu: float
    sobrou: float
    transacoes: List[FinancialTransactionResponse]


class AgronomistMessageCreateRequest(BaseModel):
    """Envio de mensagem/pergunta para a agrônoma (Ecrã 11)."""
    message: str = Field(..., min_length=1, description="Texto da dúvida (Ex: Quando semear o milho?)")


class AgronomistMessageResponse(BaseModel):
    """Mensagem no chat com a agrônoma."""
    id: str
    uuid: Optional[str] = None
    sender: str
    senderName: str
    message: str
    isRead: bool
    time: str
