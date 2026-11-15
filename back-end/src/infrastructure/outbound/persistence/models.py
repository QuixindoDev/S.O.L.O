"""
Modelos ORM de Persistência - Field Shift / S.O.L.O. Campo Amigo
Mapeia o armazenamento de dados de agricultores, autenticação, canteiros, plantas,
caderninho de contas financeiras, mensagens agronómicas e diagnósticos de carbono no PostgreSQL/PostGIS ou SQLite.

Regra Arquitetural Crítica (IDs):
- id: Chave primária numérica sequencial (Integer, autoincrement) interna para otimização
  de índices e integridade referencial no banco de dados.
- uuid: Identificador UUID único gerado automaticamente para consumo externo em APIs,
  URLs, payloads JSON e sincronização offline-first.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, relationship, Mapped, mapped_column

Base = declarative_base()


class FarmerRecord(Base):
    """
    Tabela que armazena o cadastro e credenciais dos agricultores familiares (produtores rurais).
    Relacionamento 1:N com análises de terra, canteiros, colheitas, finanças e mensagens.
    """

    __tablename__ = "farmers"

    # Chave primária interna sequencial
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    # Identificador UUID único para exposição externa
    uuid = Column(String(36), unique=True, nullable=False, index=True, default=lambda: str(uuid.uuid4()))

    # Dados cadastrais e de apresentação
    nome_completo = Column(String(200), nullable=False)
    apelido = Column(String(100), nullable=True)  # "Como você quer ser chamada? Ex: Dona Maria"
    telefone = Column(String(50), nullable=False, index=True)
    cooperativa = Column(String(150), nullable=True)
    bilhete_identidade_ou_codigo = Column(String(100), nullable=True, index=True)

    # Localização e propriedade padrão
    cidade = Column(String(100), nullable=True)  # "Feira de Santana"
    estado = Column(String(50), nullable=True)   # "BA"
    nome_sitio = Column(String(200), nullable=True)  # "Sítio Recanto Verde"
    latitude_padrao = Column(Float, nullable=True, default=-12.97)
    longitude_padrao = Column(Float, nullable=True, default=-39.51)
    tipo_solo = Column(String(50), nullable=True, default="argiloso")  # arenoso | argiloso | franco
    # Área da terra em hectares — base do cálculo da renda de carbono.
    area_hectares = Column(Float, nullable=True, default=2.5)

    # Autenticação e Segurança (Fases 1 e 2)
    password_hash = Column(String(255), nullable=True)
    is_phone_verified = Column(Boolean, default=False, nullable=False)
    otp_code_hash = Column(String(255), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    otp_attempts = Column(Integer, default=0, nullable=False)

    # Estado ativo (Soft Delete / Eliminação Lógica)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Data de registo
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relações 1:N
    analyses = relationship("LandAnalysisRecord", back_populates="farmer", cascade="all, delete-orphan")
    plots = relationship("PlotRecord", back_populates="farmer", cascade="all, delete-orphan")
    harvests = relationship("HarvestRecord", back_populates="farmer", cascade="all, delete-orphan")
    financial_records = relationship("FinancialRecord", back_populates="farmer", cascade="all, delete-orphan")
    agronomist_messages = relationship("AgronomistMessageRecord", back_populates="farmer", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<FarmerRecord(id={self.id}, uuid='{self.uuid}', nome='{self.nome_completo}', is_active={self.is_active})>"


class PlotRecord(Base):
    """
    Tabela de Canteiros / Parcelas da propriedade (Minha Terra e Horta).
    Relacionamento N:1 com Agricultor e 1:N com Plantas.
    """

    __tablename__ = "plots"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    uuid = Column(String(36), unique=True, nullable=False, index=True, default=lambda: str(uuid.uuid4()))

    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    farmer_uuid = Column(String(36), nullable=False, index=True)
    farmer = relationship("FarmerRecord", back_populates="plots")

    name = Column(String(150), nullable=False)  # "Canteiro Principal", "Horta da Cozinha", "Baixa do Riacho"
    slug = Column(String(100), nullable=True, index=True)  # "canteiro_principal"
    crops_description = Column(String(255), nullable=True)  # "Alface, Couve e Tomate Cereja"
    area_m2 = Column(Float, nullable=False, default=100.0)
    icon = Column(String(50), nullable=False, default="sprout")  # sprout, carrot, bean, leaf
    soil_texture = Column(String(50), nullable=True, default="argiloso")
    # Eliminação lógica: o canteiro removido fica no banco, mas deixa
    # de aparecer (e não volta a ser semeado).
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    plants = relationship("PlantRecord", back_populates="plot", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PlotRecord(id={self.id}, uuid='{self.uuid}', name='{self.name}', area_m2={self.area_m2})>"


class PlantRecord(Base):
    """
    Tabela de Plantas ativas no canteiro (Minhas Plantas).
    Relacionamento N:1 com PlotRecord.
    """

    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    uuid = Column(String(36), unique=True, nullable=False, index=True, default=lambda: str(uuid.uuid4()))

    plot_id = Column(Integer, ForeignKey("plots.id", ondelete="CASCADE"), nullable=False, index=True)
    plot_uuid = Column(String(36), nullable=False, index=True)
    plot = relationship("PlotRecord", back_populates="plants")

    name = Column(String(150), nullable=False)  # "Tomate Cereja", "Alface", "Couve", "Feijão"
    slug = Column(String(100), nullable=True, index=True)  # "tomate_cereja"
    icon = Column(String(50), nullable=False, default="sprout")
    status = Column(String(50), nullable=False, default="Crescendo")  # Florindo, Pronta, Crescendo, Com sede, Cortando
    care = Column(String(255), nullable=True)  # "Precisa de estaca agora", "Pode colher em 3 dias"
    tone = Column(String(50), nullable=False, default="neutral")  # primary, neutral, danger
    sowing_date = Column(String(20), nullable=True)  # "20261028"
    harvest_in_days = Column(Integer, nullable=True, default=0)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    def __repr__(self):
        return f"<PlantRecord(id={self.id}, uuid='{self.uuid}', name='{self.name}', status='{self.status}')>"


class HarvestRecord(Base):
    """
    Tabela de Histórico de Colheitas (Minhas Plantas - Colheitas).
    Relacionamento N:1 com Agricultor.
    """

    __tablename__ = "harvests"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    uuid = Column(String(36), unique=True, nullable=False, index=True, default=lambda: str(uuid.uuid4()))

    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    farmer_uuid = Column(String(36), nullable=False, index=True)
    farmer = relationship("FarmerRecord", back_populates="harvests")

    crop_name = Column(String(150), nullable=False)  # "Alface", "Tomate", "Cebolinha"
    quantity = Column(String(100), nullable=False)   # "12 cabeças", "8 kg", "3 maços"
    sold_at = Column(String(100), nullable=False, default="feira")  # "feira", "casa", "cooperativa"
    harvest_date = Column(String(20), nullable=False)  # "20261114"

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    def __repr__(self):
        return f"<HarvestRecord(id={self.id}, uuid='{self.uuid}', crop='{self.crop_name}', quantity='{self.quantity}')>"


class FinancialRecord(Base):
    """
    Tabela de Movimentações Financeiras (Meu Caderninho de Contas).
    Relacionamento N:1 com Agricultor.
    """

    __tablename__ = "financial_records"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    uuid = Column(String(36), unique=True, nullable=False, index=True, default=lambda: str(uuid.uuid4()))

    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    farmer_uuid = Column(String(36), nullable=False, index=True)
    farmer = relationship("FarmerRecord", back_populates="financial_records")

    tipo = Column(String(20), nullable=False)  # "entrada" (venda) ou "saida" (despesa)
    categoria = Column(String(100), nullable=False)  # "feira", "adubo", "sementes", "agua", "outros"
    descricao = Column(String(255), nullable=False)  # "Venda de alface na feira", "Compra de adubo"
    valor = Column(Float, nullable=False)  # 240.0, 185.0
    data = Column(String(50), nullable=False)  # "2026-11-12" ou "12 de nov"

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    def __repr__(self):
        return f"<FinancialRecord(id={self.id}, uuid='{self.uuid}', tipo='{self.tipo}', valor={self.valor})>"


class AgronomistMessageRecord(Base):
    """
    Tabela de Mensagens e Orientações Técnicas (Falar com a Agrônoma).
    Relacionamento N:1 com Agricultor.
    """

    __tablename__ = "agronomist_messages"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    uuid = Column(String(36), unique=True, nullable=False, index=True, default=lambda: str(uuid.uuid4()))

    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    farmer_uuid = Column(String(36), nullable=False, index=True)
    farmer = relationship("FarmerRecord", back_populates="agronomist_messages")

    sender = Column(String(20), nullable=False)  # "farmer" ou "agronomist"
    sender_name = Column(String(100), nullable=False)  # "Dona Maria", "Ana - Agrônoma"
    message_text = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    def __repr__(self):
        return f"<AgronomistMessageRecord(id={self.id}, uuid='{self.uuid}', sender='{self.sender}')>"


class NasaCacheRecord(Base):
    """
    Tabela de Cache de Séries e Métricas de Satélite da NASA (POWER, SMAP, ECOSTRESS, GPM).
    Garante TTL de 24h e proteção contra limites de taxa e quedas da NASA.
    """

    __tablename__ = "nasa_cache"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    cache_key = Column(String(255), unique=True, nullable=False, index=True)
    service = Column(String(50), nullable=False, index=True)  # "power", "smap", "ecostress", "gpm"
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)
    response_json = Column(JSON, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    def __repr__(self):
        return f"<NasaCacheRecord(id={self.id}, service='{self.service}', key='{self.cache_key}')>"


class LandAnalysisRecord(Base):
    """
    Tabela que armazena o histórico de análises de terras efetuadas na plataforma Field Shift.
    Cada análise pertence obrigatoriamente a um Agricultor.
    """

    __tablename__ = "land_analyses"

    # Chave primária interna sequencial (Integer / autoincrement)
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    # Identificador UUID único exposto ao exterior (segurança contra enumeração e offline-first)
    uuid = Column(String(36), unique=True, nullable=False, index=True, default=lambda: str(uuid.uuid4()))

    # Vínculo com o Agricultor (Chave Estrangeira interna e UUID externo)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    farmer_uuid = Column(String(36), nullable=False, index=True)
    farmer = relationship("FarmerRecord", back_populates="analyses")

    # Propriedade agrícola
    fazenda_uuid = Column(String(36), nullable=False, index=True)
    fazenda_nome = Column(String(200), nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    area_hectares = Column(Float, nullable=False)
    cultura_atual = Column(String(100), nullable=False)
    localizacao_descricao = Column(String(255), nullable=True)

    # Métricas de Satélite (NASA POWER / GEE)
    indice_ndvi = Column(Float, nullable=False)
    humidade_solo = Column(Float, nullable=False)
    precipitacao_anual = Column(Float, nullable=False)
    elevacao_metros = Column(Float, nullable=False)

    # Diagnóstico Agronómico do Solo
    score_saude = Column(Float, nullable=False)
    classificacao_saude = Column(String(50), nullable=False)
    risco_erosao = Column(String(50), nullable=False)

    # Rotação de Culturas Recomendada
    cultura_recomendada = Column(String(150), nullable=False)
    justificativa_rotacao = Column(Text, nullable=False)

    # Estimativa de Créditos de Carbono
    taxa_sequestro = Column(Float, nullable=False)
    creditos_liquidos_tco2e = Column(Float, nullable=False)
    valor_estimado_usd = Column(Float, nullable=False)

    # Payload completo estruturado serializado em JSON
    payload_json = Column(JSON, nullable=False)

    # Carimbo temporal de criação
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    def __repr__(self):
        return f"<LandAnalysisRecord(id={self.id}, uuid='{self.uuid}', farmer_uuid='{self.farmer_uuid}', fazenda='{self.fazenda_nome}')>"
