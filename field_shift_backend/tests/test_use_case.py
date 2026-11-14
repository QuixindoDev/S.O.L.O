"""
Testes Unitários do Caso de Uso - Field Shift
"""

import pytest
from src.application.use_cases.analyze_land import AnalyzeLandUseCase
from src.infrastructure.outbound.external.gee_adapter import MockGEEAdapter
from src.infrastructure.outbound.persistence.postgres_repository import SQLAlchemyLandAnalysisRepository
from src.infrastructure.outbound.persistence.database import init_db


def test_analyze_land_use_case_milho_degradado():
    """Valida o fluxo completo do caso de uso para terreno de Milho."""
    init_db()
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
    assert diagnostico.fazenda.nome == "Fazenda do Huambo"
    assert diagnostico.fazenda.area_hectares == 5.0
    assert diagnostico.fazenda.cultura_atual == "Milho"

    # Score e Rotação
    assert diagnostico.analise_solo.score_saude >= 0.0
    # Com NDVI 0.20 e humidade 0.15, o score deve ser < 50
    assert diagnostico.analise_solo.score_saude < 50.0
    assert diagnostico.rotacao_principal.cultura_recomendada == "Feijão-frade"

    # Carbono
    assert diagnostico.estimativa_carbono.creditos_liquidos_tco2e > 0
    assert diagnostico.estimativa_carbono.valor_estimado_usd > 0

    # Teste de persistência e recuperação
    persisted = repository.find_by_id(diagnostico.id)
    assert persisted is not None
    assert persisted.fazenda.nome == "Fazenda do Huambo"
    assert persisted.rotacao_principal.cultura_recomendada == "Feijão-frade"
