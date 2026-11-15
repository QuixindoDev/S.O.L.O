"""
Repositório de Persistência PostgreSQL/SQLAlchemy - Field Shift
Implementa LandAnalysisRepositoryPort e FarmerRepositoryPort para gravação e recuperação.
Garante integridade relacional entre Agricultores (1) e Análises de Terra (N).
"""

from typing import List, Optional
from datetime import datetime, timezone
import uuid as uuid_lib
from sqlalchemy.orm import Session, joinedload

from src.application.ports.repository_port import LandAnalysisRepositoryPort
from src.domain.entities import (
    DiagnosticoCompleto,
    Fazenda,
    MetricasSatelite,
    AnaliseSolo,
    RecomendacaoRotacao,
    EstimativaCarbono,
    Agricultor,
)
from src.infrastructure.outbound.persistence.models import LandAnalysisRecord, FarmerRecord
from src.infrastructure.outbound.persistence.database import SessionLocal


class SQLAlchemyLandAnalysisRepository(LandAnalysisRepositoryPort):
    """Implementação do repositório utilizando SQLAlchemy (PostgreSQL/SQLite)."""

    def __init__(self, session_factory=SessionLocal):
        self.session_factory = session_factory

    # ==========================================================================
    # GESTÃO DE AGRICULTORES (FARMERS)
    # ==========================================================================

    def save_farmer(self, agricultor: Agricultor) -> str:
        """Salva ou atualiza um agricultor e retorna o seu UUID."""
        session: Session = self.session_factory()
        try:
            record = session.query(FarmerRecord).filter(
                FarmerRecord.uuid == str(agricultor.uuid)
            ).first()

            if record:
                record.nome_completo = agricultor.nome_completo
                record.telefone = agricultor.telefone
                record.cooperativa = agricultor.cooperativa
                record.bilhete_identidade_ou_codigo = agricultor.bilhete_identidade_ou_codigo
                record.is_active = agricultor.is_active
            else:
                record = FarmerRecord(
                    uuid=str(agricultor.uuid),
                    nome_completo=agricultor.nome_completo,
                    telefone=agricultor.telefone,
                    cooperativa=agricultor.cooperativa,
                    bilhete_identidade_ou_codigo=agricultor.bilhete_identidade_ou_codigo,
                    is_active=agricultor.is_active,
                    created_at=agricultor.criado_em or datetime.now(timezone.utc),
                )
                session.add(record)

            session.commit()
            session.refresh(record)
            return record.uuid
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def find_farmer_by_uuid(self, farmer_uuid: str) -> Optional[Agricultor]:
        """Recupera um agricultor pelo seu UUID público."""
        session: Session = self.session_factory()
        try:
            record = session.query(FarmerRecord).filter(
                FarmerRecord.uuid == str(farmer_uuid)
            ).first()
            if not record:
                return None
            return self._farmer_record_to_entity(record)
        finally:
            session.close()

    def list_farmers(self, limit: int = 50, offset: int = 0, only_active: bool = True) -> List[Agricultor]:
        """
        Lista os agricultores cadastrados com suporte a paginação.
        Por defeito, filtra apenas os agricultores ativos (is_active == True).
        """
        session: Session = self.session_factory()
        try:
            query = session.query(FarmerRecord)
            if only_active:
                query = query.filter(FarmerRecord.is_active == True)
            records = (
                query.order_by(FarmerRecord.created_at.desc())
                .limit(limit)
                .offset(offset)
                .all()
            )
            return [self._farmer_record_to_entity(rec) for rec in records]
        finally:
            session.close()

    def get_all_farmers(self, limit: int = 50, offset: int = 0, only_active: bool = True) -> List[Agricultor]:
        """Consulta de listagem de agricultores filtrando por defeito apenas os ativos (is_active == True)."""
        return self.list_farmers(limit=limit, offset=offset, only_active=only_active)

    def deactivate_farmer(self, farmer_uuid: str) -> Optional[Agricultor]:
        """
        Desativa logicamente o agricultor pelo UUID (Soft Delete), preservando todo o histórico
        de análises de satélite, dados de solo e créditos de carbono.
        """
        session: Session = self.session_factory()
        try:
            record = session.query(FarmerRecord).filter(
                FarmerRecord.uuid == str(farmer_uuid)
            ).first()
            if not record:
                return None
            record.is_active = False
            session.commit()
            session.refresh(record)
            return self._farmer_record_to_entity(record)
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def find_or_create_default_farmer(self) -> Agricultor:
        """Obtém o primeiro agricultor existente ou cria um padrão."""
        session: Session = self.session_factory()
        try:
            record = session.query(FarmerRecord).first()
            if record:
                return self._farmer_record_to_entity(record)

            default_uuid = str(uuid_lib.uuid4())
            new_record = FarmerRecord(
                uuid=default_uuid,
                nome_completo="Agricultor Familiar de Angola",
                telefone="+244-923000000",
                cooperativa="Cooperativa Agroecológica do Planalto Central",
                bilhete_identidade_ou_codigo="BI-001-DEFAULT",
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            session.add(new_record)
            session.commit()
            session.refresh(new_record)
            return self._farmer_record_to_entity(new_record)
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    # ==========================================================================
    # GESTÃO DE ANÁLISES DE TERRA (LAND ANALYSES)
    # ==========================================================================

    def save(self, diagnostico: DiagnosticoCompleto) -> str:
        """
        Salva um diagnóstico completo vinculando-o obrigatoriamente a um Agricultor.
        Gera a chave estrangeira farmer_id internamente mantendo o farmer_uuid externo.
        """
        session: Session = self.session_factory()
        try:
            # 1. Localizar ou criar o FarmerRecord correspondente
            target_farmer_uuid = diagnostico.farmer_uuid
            farmer_rec: Optional[FarmerRecord] = None

            if target_farmer_uuid:
                farmer_rec = session.query(FarmerRecord).filter(
                    FarmerRecord.uuid == str(target_farmer_uuid)
                ).first()

            if not farmer_rec and diagnostico.agricultor:
                farmer_rec = FarmerRecord(
                    uuid=str(diagnostico.agricultor.uuid),
                    nome_completo=diagnostico.agricultor.nome_completo,
                    telefone=diagnostico.agricultor.telefone,
                    cooperativa=diagnostico.agricultor.cooperativa,
                    bilhete_identidade_ou_codigo=diagnostico.agricultor.bilhete_identidade_ou_codigo,
                    is_active=diagnostico.agricultor.is_active,
                    created_at=diagnostico.agricultor.criado_em or datetime.now(timezone.utc),
                )
                session.add(farmer_rec)
                session.flush()
            elif not farmer_rec and target_farmer_uuid:
                farmer_rec = FarmerRecord(
                    uuid=str(target_farmer_uuid),
                    nome_completo="Agricultor Familiar Local",
                    telefone="+244-900000000",
                    cooperativa="Cooperativa de Produtores",
                    is_active=True,
                    created_at=datetime.now(timezone.utc),
                )
                session.add(farmer_rec)
                session.flush()
            elif not farmer_rec:
                # Criar ou usar agricultor padrão do sistema
                farmer_rec = session.query(FarmerRecord).first()
                if not farmer_rec:
                    farmer_rec = FarmerRecord(
                        uuid=str(uuid_lib.uuid4()),
                        nome_completo="Agricultor Familiar de Angola",
                        telefone="+244-923000000",
                        cooperativa="Cooperativa Agroecológica de Angola",
                        is_active=True,
                        created_at=datetime.now(timezone.utc),
                    )
                    session.add(farmer_rec)
                    session.flush()

            # 2. Criar o registro da análise associado ao farmer_id e farmer_uuid
            record = LandAnalysisRecord(
                uuid=str(diagnostico.id),
                farmer_id=farmer_rec.id,
                farmer_uuid=farmer_rec.uuid,
                fazenda_uuid=str(diagnostico.fazenda.id),
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
            session.refresh(record)
            return record.uuid
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def find_by_uuid(self, analysis_uuid: str) -> Optional[DiagnosticoCompleto]:
        """Recupera um diagnóstico pelo seu UUID público com carregamento do Agricultor."""
        session: Session = self.session_factory()
        try:
            record = (
                session.query(LandAnalysisRecord)
                .options(joinedload(LandAnalysisRecord.farmer))
                .filter(LandAnalysisRecord.uuid == str(analysis_uuid))
                .first()
            )
            if not record:
                return None
            return self._record_to_entity(record)
        finally:
            session.close()

    def find_by_id(self, analysis_id: str) -> Optional[DiagnosticoCompleto]:
        """Recupera um diagnóstico por UUID ou por ID interno sequencial."""
        session: Session = self.session_factory()
        try:
            record = (
                session.query(LandAnalysisRecord)
                .options(joinedload(LandAnalysisRecord.farmer))
                .filter(LandAnalysisRecord.uuid == str(analysis_id))
                .first()
            )
            if record:
                return self._record_to_entity(record)

            if str(analysis_id).isdigit():
                record = (
                    session.query(LandAnalysisRecord)
                    .options(joinedload(LandAnalysisRecord.farmer))
                    .filter(LandAnalysisRecord.id == int(analysis_id))
                    .first()
                )
                if record:
                    return self._record_to_entity(record)

            return None
        finally:
            session.close()

    def list_recent(self, limit: int = 50, offset: int = 0) -> List[DiagnosticoCompleto]:
        """Lista as análises mais recentes paginadas baseadas em UUIDs."""
        session: Session = self.session_factory()
        try:
            records = (
                session.query(LandAnalysisRecord)
                .options(joinedload(LandAnalysisRecord.farmer))
                .order_by(LandAnalysisRecord.created_at.desc())
                .limit(limit)
                .offset(offset)
                .all()
            )
            return [self._record_to_entity(rec) for rec in records]
        finally:
            session.close()

    def find_by_farmer_uuid(self, farmer_uuid: str, limit: int = 50, offset: int = 0) -> List[DiagnosticoCompleto]:
        """Lista todas as análises de terra pertencentes a um determinado agricultor."""
        session: Session = self.session_factory()
        try:
            records = (
                session.query(LandAnalysisRecord)
                .options(joinedload(LandAnalysisRecord.farmer))
                .filter(LandAnalysisRecord.farmer_uuid == str(farmer_uuid))
                .order_by(LandAnalysisRecord.created_at.desc())
                .limit(limit)
                .offset(offset)
                .all()
            )
            return [self._record_to_entity(rec) for rec in records]
        finally:
            session.close()

    # ==========================================================================
    # CONVERSORES ORM -> DOMÍNIO
    # ==========================================================================

    def _farmer_record_to_entity(self, record: FarmerRecord) -> Agricultor:
        """Converte FarmerRecord em entidade pura Agricultor."""
        return Agricultor(
            id=record.uuid,
            nome_completo=record.nome_completo,
            telefone=record.telefone,
            cooperativa=record.cooperativa,
            bilhete_identidade_ou_codigo=record.bilhete_identidade_ou_codigo,
            is_active=bool(record.is_active) if getattr(record, "is_active", None) is not None else True,
            criado_em=record.created_at,
        )

    def _record_to_entity(self, record: LandAnalysisRecord) -> DiagnosticoCompleto:
        """Reconstitui a entidade de domínio DiagnosticoCompleto com o Agricultor vinculado."""
        payload = record.payload_json
        sat = payload.get("metricas_satelite", {})
        solo = payload.get("analise_solo", {})
        rot = payload.get("rotacao_principal", {})
        carb = payload.get("estimativa_carbono", {})

        # Reconstituir o agricultor
        agricultor: Optional[Agricultor] = None
        if record.farmer:
            agricultor = self._farmer_record_to_entity(record.farmer)
        elif "agricultor" in payload and payload["agricultor"]:
            ag_data = payload["agricultor"]
            agricultor = Agricultor(
                id=ag_data.get("id", record.farmer_uuid),
                nome_completo=ag_data.get("nome_completo", "Agricultor"),
                telefone=ag_data.get("telefone", "+244900000000"),
                cooperativa=ag_data.get("cooperativa"),
                bilhete_identidade_ou_codigo=ag_data.get("bilhete_identidade_ou_codigo"),
            )

        alternativas = [
            RecomendacaoRotacao(
                cultura_recomendada=a["cultura_recomendada"],
                nome_cientifico=a.get("nome_cientifico"),
                justificativa=a["justificativa"],
                beneficio_ecologico=a["beneficio_ecologico"],
                taxa_sequestro_adicional=float(a["taxa_sequestro_adicional"]),
                compatibilidade_clima=a["compatibilidade_clima"],
            )
            for a in payload.get("alternativas_rotacao", [])
        ]

        return DiagnosticoCompleto(
            id=record.uuid,
            fazenda=Fazenda(
                id=record.fazenda_uuid,
                nome=record.fazenda_nome,
                latitude=record.latitude,
                longitude=record.longitude,
                area_hectares=record.area_hectares,
                cultura_atual=record.cultura_atual,
                localizacao_descricao=record.localizacao_descricao,
                farmer_uuid=record.farmer_uuid,
            ),
            metricas_satelite=MetricasSatelite(
                ndvi=float(sat.get("ndvi", record.indice_ndvi)),
                humidade_solo=float(sat.get("humidade_solo", record.humidade_solo)),
                precipitacao=float(sat.get("precipitacao", record.precipitacao_anual)),
                elevacao=float(sat.get("elevacao", record.elevacao_metros)),
                temperatura_media=sat.get("temperatura_media"),
                fonte_dados=sat.get("fonte_dados", "Satélite / NASA POWER / GEE"),
            ),
            analise_solo=AnaliseSolo(
                score_saude=float(record.score_saude),
                classificacao_saude=record.classificacao_saude,
                indice_ndvi=float(record.indice_ndvi),
                humidade_solo=float(record.humidade_solo),
                precipitacao_anual=float(record.precipitacao_anual),
                elevacao_metros=float(record.elevacao_metros),
                risco_erosao=record.risco_erosao,
                diagnostico_detalhado=solo.get("diagnostico_detalhado", ""),
            ),
            rotacao_principal=RecomendacaoRotacao(
                cultura_recomendada=record.cultura_recomendada,
                nome_cientifico=rot.get("nome_cientifico"),
                justificativa=record.justificativa_rotacao,
                beneficio_ecologico=rot.get("beneficio_ecologico", "Restauração de solo"),
                taxa_sequestro_adicional=float(record.taxa_sequestro),
                compatibilidade_clima=rot.get("compatibilidade_clima", "Alta"),
            ),
            alternativas_rotacao=alternativas,
            estimativa_carbono=EstimativaCarbono(
                area_hectares=float(carb.get("area_hectares", record.area_hectares)),
                taxa_sequestro=float(record.taxa_sequestro),
                fator_conversao_co2=float(carb.get("fator_conversao_co2", 3.67)),
                margem_seguranca=float(carb.get("margem_seguranca", 0.20)),
                preco_por_credito_usd=float(carb.get("preco_por_credito_usd", 20.0)),
            ),
            agricultor=agricultor,
            gerado_em=record.created_at,
        )
