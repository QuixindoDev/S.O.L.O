"""
Testes Unitários da Camada de Persistência e Repositório - Field Shift
Valida a regra arquitetural crítica:
- Chave primária interna numérica (Integer, autoincrement)
- UUID único para comunicação externa
"""

import uuid
from datetime import datetime, timezone
import pytest
from sqlalchemy.orm import Session

from src.infrastructure.outbound.persistence.database import init_db, SessionLocal, engine
from src.infrastructure.outbound.persistence.models import LandAnalysisRecord
from src.infrastructure.outbound.persistence.postgres_repository import SQLAlchemyLandAnalysisRepository
from src.domain.entities import (
    DiagnosticoCompleto,
    Fazenda,
    MetricasSatelite,
    AnaliseSolo,
    RecomendacaoRotacao,
    EstimativaCarbono,
)


@pytest.fixture(autouse=True)
def setup_database():
    """Garante tabelas criadas antes de cada teste."""
    init_db()
    yield


def _criar_diagnostico_exemplo(custom_uuid: str = None) -> DiagnosticoCompleto:
    target_uuid = custom_uuid or str(uuid.uuid4())
    fazenda_uuid = str(uuid.uuid4())
    return DiagnosticoCompleto(
        id=target_uuid,
        fazenda=Fazenda(
            id=fazenda_uuid,
            nome="Fazenda Teste Benguela",
            latitude=-12.58,
            longitude=13.41,
            area_hectares=10.0,
            cultura_atual="Milho",
            localizacao_descricao="Benguela, Angola"
        ),
        metricas_satelite=MetricasSatelite(
            ndvi=0.32,
            humidade_solo=0.22,
            precipitacao=750.0,
            elevacao=600.0,
            temperatura_media=24.5,
            fonte_dados="NASA POWER / GEE"
        ),
        analise_solo=AnaliseSolo(
            score_saude=45.0,
            classificacao_saude="Degradado",
            indice_ndvi=0.32,
            humidade_solo=0.22,
            precipitacao_anual=750.0,
            elevacao_metros=600.0,
            risco_erosao="Médio",
            diagnostico_detalhado="Solo sob estresse moderado e depleo de N."
        ),
        rotacao_principal=RecomendacaoRotacao(
            cultura_recomendada="Feijão-frade",
            nome_cientifico="Vigna unguiculata",
            justificativa="Fixação biológica de nitrogénio via simbiose com Rhizobium.",
            beneficio_ecologico="Restauração de fertilidade natural e ciclagem de nutrientes.",
            taxa_sequestro_adicional=1.25,
            compatibilidade_clima="Alta para o clima de Angola"
        ),
        alternativas_rotacao=[
            RecomendacaoRotacao(
                cultura_recomendada="Amendoim (Ginguba)",
                nome_cientifico="Arachis hypogaea",
                justificativa="Fixação de N2 e geração de renda imediata.",
                beneficio_ecologico="Cobertura de solo densa contra erosão.",
                taxa_sequestro_adicional=1.10,
                compatibilidade_clima="Alta"
            )
        ],
        estimativa_carbono=EstimativaCarbono(
            area_hectares=10.0,
            taxa_sequestro=1.25,
            fator_conversao_co2=3.67,
            margem_seguranca=0.20,
            preco_por_credito_usd=20.0
        ),
        gerado_em=datetime.now(timezone.utc)
    )


def test_schema_model_id_is_integer_and_uuid_is_string():
    """Valida que o modelo SQLAlchemy possui id (Integer PK) e uuid (String única)."""
    assert hasattr(LandAnalysisRecord, "id")
    assert hasattr(LandAnalysisRecord, "uuid")
    assert hasattr(LandAnalysisRecord, "fazenda_uuid")
    assert hasattr(LandAnalysisRecord, "farmer_id")
    assert hasattr(LandAnalysisRecord, "farmer_uuid")

    # Verifica tipo das colunas
    col_id = LandAnalysisRecord.__table__.columns["id"]
    col_uuid = LandAnalysisRecord.__table__.columns["uuid"]
    col_farmer_id = LandAnalysisRecord.__table__.columns["farmer_id"]

    assert col_id.primary_key is True
    # O tipo do id deve ser Integer
    from sqlalchemy import Integer, String
    assert isinstance(col_id.type, Integer)
    assert isinstance(col_uuid.type, String)
    assert isinstance(col_farmer_id.type, Integer)
    assert col_uuid.unique is True


def test_repository_save_and_retrieve_by_uuid():
    """Verifica gravação e recuperação usando o UUID público."""
    repo = SQLAlchemyLandAnalysisRepository()
    expected_uuid = str(uuid.uuid4())
    diag = _criar_diagnostico_exemplo(custom_uuid=expected_uuid)

    saved_uuid = repo.save(diag)
    assert saved_uuid == expected_uuid

    # Recupera via find_by_uuid
    retrieved = repo.find_by_uuid(expected_uuid)
    assert retrieved is not None
    assert retrieved.id == expected_uuid
    assert retrieved.uuid == expected_uuid
    assert retrieved.fazenda.nome == "Fazenda Teste Benguela"
    assert retrieved.rotacao_principal.cultura_recomendada == "Feijão-frade"

    # Confirma diretamente na base de dados que id é um inteiro sequencial
    session: Session = SessionLocal()
    try:
        raw_record = session.query(LandAnalysisRecord).filter(
            LandAnalysisRecord.uuid == expected_uuid
        ).first()
        assert raw_record is not None
        assert isinstance(raw_record.id, int)
        assert raw_record.id >= 1
        assert raw_record.uuid == expected_uuid
    finally:
        session.close()


def test_repository_list_recent():
    """Verifica paginação e listagem de registros recentes."""
    repo = SQLAlchemyLandAnalysisRepository()
    for _ in range(3):
        repo.save(_criar_diagnostico_exemplo())

    recentes = repo.list_recent(limit=2, offset=0)
    assert len(recentes) == 2
    for r in recentes:
        assert isinstance(r.id, str)
        # O id exposto deve ser um UUID válido
        assert len(r.id) == 36
