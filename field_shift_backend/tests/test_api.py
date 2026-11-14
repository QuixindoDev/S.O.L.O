"""
Testes de Integração da API HTTP - Field Shift
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from src.infrastructure.inbound.http.routers import set_dependencies
from src.infrastructure.outbound.external.gee_adapter import MockGEEAdapter
from src.infrastructure.outbound.persistence.postgres_repository import SQLAlchemyLandAnalysisRepository
from src.infrastructure.outbound.persistence.database import init_db


@pytest.fixture(scope="module")
def client():
    init_db()
    mock_satellite = MockGEEAdapter()
    repo = SQLAlchemyLandAnalysisRepository()
    set_dependencies(mock_satellite, repo)
    with TestClient(app) as test_client:
        yield test_client


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["projeto"] == "Field Shift"
    assert "/docs" in data["documentacao_interativa"]


def test_health_check_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operacional"
    assert "Adapter" in data["satelite_adapter"]


def test_crops_endpoint(client):
    response = client.get("/api/v1/crops")
    assert response.status_code == 200
    data = response.json()
    assert "culturas_base" in data
    assert "leguminosas_regenerativas" in data


def test_carbon_info_endpoint(client):
    response = client.get("/api/v1/carbon-calculator-info")
    assert response.status_code == 200
    data = response.json()
    assert "formula" in data
    assert "parametros" in data


def test_analyze_land_endpoint(client):
    payload = {
        "latitude": -12.77,
        "longitude": 15.73,
        "area_hectares": 8.5,
        "cultura_atual": "Milho",
        "nome": "Fazenda Modelo de Cachiungo",
        "localizacao_descricao": "Huambo, Angola",
        "margem_seguranca": 0.20,
        "preco_carbono_usd": 22.0
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["id"] is not None
    assert data["fazenda"]["nome"] == "Fazenda Modelo de Cachiungo"
    assert data["fazenda"]["area_hectares"] == 8.5
    assert data["analise_solo"]["score_saude"] >= 0.0
    assert data["rotacao_principal"]["cultura_recomendada"] is not None
    assert data["estimativa_carbono"]["creditos_liquidos_tco2e"] > 0
    assert data["estimativa_carbono"]["valor_estimado_usd"] > 0

    analysis_id = data["id"]

    # Teste de recuperação pelo ID
    get_res = client.get(f"/api/v1/analyses/{analysis_id}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["id"] == analysis_id
    assert get_data["fazenda"]["cultura_atual"] == "Milho"


def test_list_analyses_endpoint(client):
    response = client.get("/api/v1/analyses?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_analyze_invalid_coordinates(client):
    payload = {
        "latitude": 95.0,  # Inválido (> 90)
        "longitude": 15.73,
        "area_hectares": 10.0,
        "cultura_atual": "Milho"
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 422
