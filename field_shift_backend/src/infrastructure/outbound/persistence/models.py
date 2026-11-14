"""
Modelos ORM de Persistência - Field Shift
Mapeia o armazenamento de dados de fazendas e diagnósticos de carbono no PostgreSQL/PostGIS ou SQLite.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class LandAnalysisRecord(Base):
    """Tabela que armazena o histórico de análises de terras efetuadas na plataforma."""

    __tablename__ = "land_analyses"

    id = Column(String(36), primary_key=True, index=True)
    fazenda_id = Column(String(36), nullable=False, index=True)
    fazenda_nome = Column(String(200), nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    area_hectares = Column(Float, nullable=False)
    cultura_atual = Column(String(100), nullable=False)
    localizacao_descricao = Column(String(255), nullable=True)

    # Métricas de Satélite
    indice_ndvi = Column(Float, nullable=False)
    humidade_solo = Column(Float, nullable=False)
    precipitacao_anual = Column(Float, nullable=False)
    elevacao_metros = Column(Float, nullable=False)

    # Diagnóstico de Solo
    score_saude = Column(Float, nullable=False)
    classificacao_saude = Column(String(50), nullable=False)
    risco_erosao = Column(String(50), nullable=False)

    # Rotação Recomendada
    cultura_recomendada = Column(String(150), nullable=False)
    justificativa_rotacao = Column(Text, nullable=False)

    # Carbono
    taxa_sequestro = Column(Float, nullable=False)
    creditos_liquidos_tco2e = Column(Float, nullable=False)
    valor_estimado_usd = Column(Float, nullable=False)

    # Payload completo serializado em JSON
    payload_json = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    def __repr__(self):
        return f"<LandAnalysisRecord(id={self.id}, fazenda='{self.fazenda_nome}', score={self.score_saude})>"
