"""
Modelos ORM de Persistência - Field Shift
Mapeia o armazenamento de dados de agricultores, fazendas e diagnósticos de carbono no PostgreSQL/PostGIS ou SQLite.

Regra Arquitetural Crítica (IDs):
- id: Chave primária numérica sequencial (Integer, autoincrement) interna para otimização
  de índices e integridade referencial no banco de dados.
- uuid: Identificador UUID único gerado automaticamente para consumo externo em APIs,
  URLs, payloads JSON e sincronização offline-first.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class FarmerRecord(Base):
    """
    Tabela que armazena o cadastro dos agricultores familiares (produtores rurais).
    Relacionamento 1:N com as análises de terra (um agricultor possui várias parcelas).
    """

    __tablename__ = "farmers"

    # Chave primária interna sequencial
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    # Identificador UUID único para exposição externa
    uuid = Column(String(36), unique=True, nullable=False, index=True, default=lambda: str(uuid.uuid4()))

    # Dados cadastrais
    nome_completo = Column(String(200), nullable=False)
    telefone = Column(String(50), nullable=False, index=True)
    cooperativa = Column(String(150), nullable=True)
    bilhete_identidade_ou_codigo = Column(String(100), nullable=True, index=True)

    # Data de registo
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relação 1:N com análises de terras
    analyses = relationship("LandAnalysisRecord", back_populates="farmer", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<FarmerRecord(id={self.id}, uuid='{self.uuid}', nome='{self.nome_completo}')>"


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
