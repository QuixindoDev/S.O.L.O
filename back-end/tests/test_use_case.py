"""
Testes Unitários do Caso de Uso - Field Shift
"""

import uuid
import pytest
from src.application.use_cases.analyze_land import AnalyzeLandUseCase
from src.infrastructure.outbound.external.gee_adapter import MockGEEAdapter
from src.infrastructure.outbound.persistence.postgres_repository import SQLAlchemyLandAnalysisRepository
from src.infrastructure.outbound.persistence.database import init_db


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_analyze_land_use_case_milho_degradado():
    """Valida o fluxo completo do caso de uso para terreno de Milho degradado."""
    mock_satellite = MockGEEAdapter(default_ndvi=0.20, default_humidade=0.15)
    repository = SQLAlchemyLandAnalysisRepository()
    use_case = AnalyzeLandUseCase(satellite_port=mock_satellite, repository=repository)

    diagnostico = use_case.execute(
        latitude=-12.77,
        longitude=15.73,
        area_hectares=5.0,
        cultura_atual="Milho",
        nome_fazenda="Fazenda do Huambo"
    )

    assert diagnostico.id is not None
    # Deve ser um UUID válido
    assert len(diagnostico.id) == 36
    assert diagnostico.fazenda.nome == "Fazenda do Huambo"
    assert diagnostico.fazenda.area_hectares == 5.0
    assert diagnostico.fazenda.cultura_atual == "Milho"

    # Score e Rotação: Milho degradado (< 50) deve prescrever Feijão-frade
    assert diagnostico.analise_solo.score_saude >= 0.0
    assert diagnostico.analise_solo.score_saude < 50.0
    assert diagnostico.rotacao_principal.cultura_recomendada == "Feijão-frade"

    # Carbono
    assert diagnostico.estimativa_carbono.creditos_liquidos_tco2e > 0
    assert diagnostico.estimativa_carbono.valor_estimado_usd > 0

    # Teste de persistência e recuperação por UUID
    persisted = repository.find_by_uuid(diagnostico.id)
    assert persisted is not None
    assert persisted.fazenda.nome == "Fazenda do Huambo"
    assert persisted.rotacao_principal.cultura_recomendada == "Feijão-frade"


def test_analyze_land_use_case_with_custom_client_uuid_offline_first():
    """Valida suporte a UUIDs pré-gerados pelo cliente para suporte offline-first."""
    mock_satellite = MockGEEAdapter(default_ndvi=0.45, default_humidade=0.35)
    repository = SQLAlchemyLandAnalysisRepository()
    use_case = AnalyzeLandUseCase(satellite_port=mock_satellite, repository=repository)

    custom_analysis_uuid = str(uuid.uuid4())
    custom_fazenda_uuid = str(uuid.uuid4())

    diagnostico = use_case.execute(
        latitude=-12.77,
        longitude=15.73,
        area_hectares=12.0,
        cultura_atual="Mandioca",
        nome_fazenda="Talhão Offline",
        analysis_uuid=custom_analysis_uuid,
        fazenda_uuid=custom_fazenda_uuid
    )

    assert diagnostico.id == custom_analysis_uuid
    assert diagnostico.uuid == custom_analysis_uuid
    assert diagnostico.fazenda.id == custom_fazenda_uuid
    assert diagnostico.fazenda.uuid == custom_fazenda_uuid

    # Recuperação pelo repositório
    retrieved = repository.find_by_uuid(custom_analysis_uuid)
    assert retrieved is not None
    assert retrieved.id == custom_analysis_uuid
    assert retrieved.fazenda.id == custom_fazenda_uuid
