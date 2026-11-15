"""
Testes de Integração da API HTTP - Field Shift
Validação dos endpoints REST, esquemas Pydantic v2 e uso estrito de UUIDs.
"""

import uuid
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


def test_health_check_endpoints(client):
    # Rota raiz /health
    res_root = client.get("/health")
    assert res_root.status_code == 200
    data_root = res_root.json()
    assert data_root["status"] == "operacional"
    assert "Adapter" in data_root["satelite_adapter"]

    # Rota prefixada /api/v1/health
    res_v1 = client.get("/api/v1/health")
    assert res_v1.status_code == 200
    assert res_v1.json()["status"] == "operacional"


def test_crops_endpoint(client):
    response = client.get("/api/v1/crops")
    assert response.status_code == 200
    data = response.json()
    assert "culturas_base" in data
    assert "leguminosas_regenerativas" in data
    assert any(c["nome"] == "Milho" for c in data["culturas_base"])
    assert any("Feijão-frade" in c["nome"] for c in data["leguminosas_regenerativas"])


def test_carbon_info_endpoint(client):
    response = client.get("/api/v1/carbon-calculator-info")
    assert response.status_code == 200
    data = response.json()
    assert "formula" in data
    assert "parametros" in data
    assert "3.67" in data["formula"] or "3.67" in data["parametros"]["Fator 3.67"]


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

    # Validação dos UUIDs
    assert "id" in data
    assert "uuid" in data
    assert len(data["id"]) == 36
    analysis_uuid = data["uuid"] or data["id"]

    assert data["fazenda"]["nome"] == "Fazenda Modelo de Cachiungo"
    assert data["fazenda"]["area_hectares"] == 8.5
    assert len(data["fazenda"]["id"]) == 36

    assert data["analise_solo"]["score_saude"] >= 0.0
    assert data["rotacao_principal"]["cultura_recomendada"] is not None
    assert data["estimativa_carbono"]["creditos_liquidos_tco2e"] > 0
    assert data["estimativa_carbono"]["valor_estimado_usd"] > 0

    # Teste de recuperação pelo UUID na URL
    get_res = client.get(f"/api/v1/analyses/{analysis_uuid}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["id"] == analysis_uuid
    assert get_data["fazenda"]["cultura_atual"] == "Milho"


def test_analyze_land_with_client_uuid_offline_first(client):
    client_uuid = str(uuid.uuid4())
    client_fazenda_uuid = str(uuid.uuid4())
    payload = {
        "latitude": -12.50,
        "longitude": 13.50,
        "area_hectares": 6.0,
        "cultura_atual": "Mandioca",
        "nome": "Talhão Offline de Teste",
        "uuid": client_uuid,
        "fazenda_uuid": client_fazenda_uuid
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["id"] == client_uuid
    assert data["uuid"] == client_uuid
    assert data["fazenda"]["id"] == client_fazenda_uuid

    # Recuperação pelo UUID
    get_res = client.get(f"/api/v1/analyses/{client_uuid}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == client_uuid


def test_list_analyses_endpoint(client):
    response = client.get("/api/v1/analyses?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    # Verifica se os itens contêm UUID
    for item in data:
        assert len(item["id"]) == 36


def test_analyze_invalid_coordinates(client):
    payload = {
        "latitude": 95.0,  # Inválido (> 90)
        "longitude": 15.73,
        "area_hectares": 5.0,
        "cultura_atual": "Milho"
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 422


def test_analyze_invalid_area(client):
    payload = {
        "latitude": -12.77,
        "longitude": 15.73,
        "area_hectares": -5.0,  # Inválido (<= 0)
        "cultura_atual": "Milho"
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 422


def test_analyze_invalid_uuid_format(client):
    payload = {
        "latitude": -12.77,
        "longitude": 15.73,
        "area_hectares": 5.0,
        "cultura_atual": "Milho",
        "uuid": "invalid-not-a-uuid"  # Inválido
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 422


# ==============================================================================
# TESTES DOS ENDPOINTS DE AGRICULTORES (FARMERS)
# ==============================================================================

def test_create_and_get_farmer(client):
    farmer_payload = {
        "nome_completo": "Afonso Pedro Ndala",
        "telefone": "+244 924 888 999",
        "cooperativa": "Cooperativa 1º de Maio - Huambo",
        "bilhete_identidade_ou_codigo": "009182HA"
    }
    res = client.post("/api/v1/farmers", json=farmer_payload)
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert "uuid" in data
    assert data["nome_completo"] == "Afonso Pedro Ndala"
    assert data["telefone"] == "+244 924 888 999"

    farmer_uuid = data["uuid"]

    # Obter agricultor por UUID
    get_res = client.get(f"/api/v1/farmers/{farmer_uuid}")
    assert get_res.status_code == 200
    assert get_res.json()["uuid"] == farmer_uuid
    assert get_res.json()["nome_completo"] == "Afonso Pedro Ndala"


def test_create_farmer_invalid_payload(client):
    # Nome em branco
    res = client.post("/api/v1/farmers", json={"nome_completo": "  ", "telefone": "+244900000000"})
    assert res.status_code == 422

    # Telefone em branco
    res2 = client.post("/api/v1/farmers", json={"nome_completo": "Afonso", "telefone": "  "})
    assert res2.status_code == 422


def test_list_farmers_endpoint(client):
    res = client.get("/api/v1/farmers?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_farmer_not_found(client):
    fake_uuid = str(uuid.uuid4())
    res = client.get(f"/api/v1/farmers/{fake_uuid}")
    assert res.status_code == 404


def test_analyze_land_bound_to_farmer_and_list_farmer_analyses(client):
    # 1. Cria um agricultor específico
    farmer_payload = {
        "nome_completo": "Maria Esperança Katchiungo",
        "telefone": "+244 931 777 666",
        "cooperativa": "Cooperativa Rainha Ginga"
    }
    f_res = client.post("/api/v1/farmers", json=farmer_payload)
    assert f_res.status_code == 201
    farmer_uuid = f_res.json()["uuid"]

    # 2. Executa uma análise vinculando o farmer_uuid
    analysis_payload = {
        "latitude": -12.77,
        "longitude": 15.73,
        "area_hectares": 4.2,
        "cultura_atual": "Milho",
        "farmer_uuid": farmer_uuid,
        "nome": "Talhão da Maria"
    }
    an_res = client.post("/api/v1/analyze", json=analysis_payload)
    assert an_res.status_code == 201
    an_data = an_res.json()

    assert an_data["farmer_uuid"] == farmer_uuid
    assert an_data["agricultor"] is not None
    assert an_data["agricultor"]["uuid"] == farmer_uuid
    assert an_data["agricultor"]["nome_completo"] == "Maria Esperança Katchiungo"

    # 3. Consulta as análises desse agricultor específico
    farmer_an_res = client.get(f"/api/v1/farmers/{farmer_uuid}/analyses")
    assert farmer_an_res.status_code == 200
    farmer_analyses = farmer_an_res.json()
    assert len(farmer_analyses) >= 1
    assert any(a["id"] == an_data["id"] for a in farmer_analyses)

    # 4. Consulta de análises para agricultor inexistente deve dar 404
    fake_uuid = str(uuid.uuid4())
    not_found_res = client.get(f"/api/v1/farmers/{fake_uuid}/analyses")
    assert not_found_res.status_code == 404

