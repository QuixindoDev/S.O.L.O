"""
Repositório de Persistência PostgreSQL/SQLAlchemy - Field Shift
Implementa LandAnalysisRepositoryPort para gravação e recuperação de análises.
"""

from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from src.application.ports.repository_port import LandAnalysisRepositoryPort
from src.domain.entities import (
    DiagnosticoCompleto,
    Fazenda,
    MetricasSatelite,
    AnaliseSolo,
    RecomendacaoRotacao,
    EstimativaCarbono,
)
from src.infrastructure.outbound.persistence.models import LandAnalysisRecord
from src.infrastructure.outbound.persistence.database import SessionLocal


class SQLAlchemyLandAnalysisRepository(LandAnalysisRepositoryPort):
    """Implementação do repositório utilizando SQLAlchemy (PostgreSQL/SQLite)."""

    def __init__(self, session_factory=SessionLocal):
        self.session_factory = session_factory

    def save(self, diagnostico: DiagnosticoCompleto) -> str:
        session: Session = self.session_factory()
        try:
            record = LandAnalysisRecord(
                id=diagnostico.id,
                fazenda_id=diagnostico.fazenda.id,
                fazenda_nome=diagnostico.fazenda.nome,
                latitude=diagnostico.fazenda.latitude,
                longitude=diagnostico.fazenda.longitude,
                area_hectares=diagnostico.fazenda.area_hectares,
                cultura_atual=diagnostico.fazenda.cultura_atual,
                localizacao_descricao=diagnostico.fazenda.localizacao_descricao,
                indice_ndvi=diagnostico.analise_solo.indice_ndvi,
                humidade_solo=diagnostico.analise_solo.humidade_solo,
                precipitacao_anual=diagnostico.analise_solo.precipitacao_anual,
                elevacao_metros=diagnostico.analise_solo.elevacao_metros,
                score_saude=diagnostico.analise_solo.score_saude,
                classificacao_saude=diagnostico.analise_solo.classificacao_saude,
                risco_erosao=diagnostico.analise_solo.risco_erosao,
                cultura_recomendada=diagnostico.rotacao_principal.cultura_recomendada,
                justificativa_rotacao=diagnostico.rotacao_principal.justificativa,
                taxa_sequestro=diagnostico.estimativa_carbono.taxa_sequestro,
                creditos_liquidos_tco2e=diagnostico.estimativa_carbono.creditos_liquidos_tco2e,
                valor_estimado_usd=diagnostico.estimativa_carbono.valor_estimado_usd,
                payload_json=diagnostico.to_dict(),
                created_at=diagnostico.gerado_em or datetime.now(timezone.utc),
            )
            session.add(record)
            session.commit()
            return record.id
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def find_by_id(self, analysis_id: str) -> Optional[DiagnosticoCompleto]:
        session: Session = self.session_factory()
        try:
            record = session.query(LandAnalysisRecord).filter(LandAnalysisRecord.id == analysis_id).first()
            if not record:
                return None
            return self._record_to_entity(record)
        finally:
            session.close()

    def list_recent(self, limit: int = 50, offset: int = 0) -> List[DiagnosticoCompleto]:
        session: Session = self.session_factory()
        try:
            records = (
                session.query(LandAnalysisRecord)
                .order_by(LandAnalysisRecord.created_at.desc())
                .limit(limit)
                .offset(offset)
                .all()
            )
            return [self._record_to_entity(rec) for rec in records]
        finally:
            session.close()

    def _record_to_entity(self, record: LandAnalysisRecord) -> DiagnosticoCompleto:
        """Reconstitui a entidade de domínio DiagnosticoCompleto a partir do payload persistido."""
        payload = record.payload_json
        faz = payload["fazenda"]
        sat = payload["metricas_satelite"]
        solo = payload["analise_solo"]
        rot = payload["rotacao_principal"]
        carb = payload["estimativa_carbono"]

        alternativas = [
            RecomendacaoRotacao(
                cultura_recomendada=a["cultura_recomendada"],
                nome_cientifico=a.get("nome_cientifico"),
                justificativa=a["justificativa"],
                beneficio_ecologico=a["beneficio_ecologico"],
                taxa_sequestro_adicional=a["taxa_sequestro_adicional"],
                compatibilidade_clima=a["compatibilidade_clima"],
            )
            for a in payload.get("alternativas_rotacao", [])
        ]

        return DiagnosticoCompleto(
            id=record.id,
            fazenda=Fazenda(
                id=faz["id"],
                nome=faz.get("nome"),
                latitude=faz["latitude"],
                longitude=faz["longitude"],
                area_hectares=faz["area_hectares"],
                cultura_atual=faz["cultura_atual"],
                localizacao_descricao=faz.get("localizacao_descricao"),
            ),
            metricas_satelite=MetricasSatelite(
                ndvi=sat["ndvi"],
                humidade_solo=sat["humidade_solo"],
                precipitacao=sat["precipitacao"],
                elevacao=sat["elevacao"],
                temperatura_media=sat.get("temperatura_media"),
                fonte_dados=sat.get("fonte_dados", "Satélite"),
            ),
            analise_solo=AnaliseSolo(
                score_saude=solo["score_saude"],
                classificacao_saude=solo["classificacao_saude"],
                indice_ndvi=solo["indice_ndvi"],
                humidade_solo=solo["humidade_solo"],
                precipitacao_anual=solo["precipitacao_anual"],
                elevacao_metros=solo["elevacao_metros"],
                risco_erosao=solo["risco_erosao"],
                diagnostico_detalhado=solo["diagnostico_detalhado"],
            ),
            rotacao_principal=RecomendacaoRotacao(
                cultura_recomendada=rot["cultura_recomendada"],
                nome_cientifico=rot.get("nome_cientifico"),
                justificativa=rot["justificativa"],
                beneficio_ecologico=rot["beneficio_ecologico"],
                taxa_sequestro_adicional=rot["taxa_sequestro_adicional"],
                compatibilidade_clima=rot["compatibilidade_clima"],
            ),
            alternativas_rotacao=alternativas,
            estimativa_carbono=EstimativaCarbono(
                area_hectares=carb["area_hectares"],
                taxa_sequestro=carb["taxa_sequestro"],
                fator_conversao_co2=carb.get("fator_conversao_co2", 3.67),
                margem_seguranca=carb.get("margem_seguranca", 0.20),
                preco_por_credito_usd=carb.get("preco_por_credito_usd", 20.0),
            ),
            gerado_em=record.created_at,
        )
