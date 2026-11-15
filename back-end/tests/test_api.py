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


def test_deactivate_farmer_endpoint_patch(client):
    """Testa o endpoint PATCH /api/v1/farmers/{farmer_uuid}/deactivate."""
    # 1. Cria agricultor
    farmer_payload = {
        "nome_completo": "Mateus Chitumba",
        "telefone": "+244 923 001 002",
        "cooperativa": "Cooperativa Caála"
    }
    create_res = client.post("/api/v1/farmers", json=farmer_payload)
    assert create_res.status_code == 201
    farmer_uuid = create_res.json()["uuid"]
    assert create_res.json()["is_active"] is True

    # 2. Desativa via PATCH
    deact_res = client.patch(f"/api/v1/farmers/{farmer_uuid}/deactivate")
    assert deact_res.status_code == 200
    deact_data = deact_res.json()
    assert deact_data["uuid"] == farmer_uuid
    assert deact_data["is_active"] is False
    assert "preservado" in deact_data["mensagem"]
    assert deact_data["agricultor"]["is_active"] is False

    # 3. Consulta direta: agricultor ainda existe, mas com is_active=False
    get_res = client.get(f"/api/v1/farmers/{farmer_uuid}")
    assert get_res.status_code == 200
    assert get_res.json()["is_active"] is False

    # 4. Listagem padrão NÃO deve conter o agricultor desativado
    list_res = client.get("/api/v1/farmers?limit=100")
    assert list_res.status_code == 200
    active_uuids = [f["uuid"] for f in list_res.json()]
    assert farmer_uuid not in active_uuids

    # 5. Listagem com include_inactive=true DEVE conter o agricultor desativado
    list_all_res = client.get("/api/v1/farmers?limit=100&include_inactive=true")
    assert list_all_res.status_code == 200
    all_uuids = [f["uuid"] for f in list_all_res.json()]
    assert farmer_uuid in all_uuids


def test_delete_farmer_soft_delete_endpoint(client):
    """Testa o endpoint DELETE /api/v1/farmers/{farmer_uuid} executando soft delete."""
    # 1. Cria agricultor
    farmer_payload = {
        "nome_completo": "Laurinda Tchissola",
        "telefone": "+244 944 777 888",
        "cooperativa": "Associação de Mulheres Rurais"
    }
    create_res = client.post("/api/v1/farmers", json=farmer_payload)
    assert create_res.status_code == 201
    farmer_uuid = create_res.json()["uuid"]

    # 2. Executa DELETE físico aparente (que internamente é Soft Delete)
    del_res = client.delete(f"/api/v1/farmers/{farmer_uuid}")
    assert del_res.status_code == 200
    del_data = del_res.json()
    assert del_data["uuid"] == farmer_uuid
    assert del_data["is_active"] is False
    assert "preservado" in del_data["mensagem"]

    # 3. Valida que o agricultor NÃO foi removido fisicamente da base
    get_res = client.get(f"/api/v1/farmers/{farmer_uuid}")
    assert get_res.status_code == 200
    assert get_res.json()["uuid"] == farmer_uuid
    assert get_res.json()["is_active"] is False


def test_deactivate_farmer_preserves_carbon_and_land_analyses_api(client):
    """
    Testa a garantia de auditoria via API:
    O histórico de análises de terras e créditos de carbono continua acessível
    mesmo após o agricultor ser desativado logicamente.
    """
    # 1. Cria agricultor
    f_res = client.post("/api/v1/farmers", json={
        "nome_completo": "Sebastião Candimba",
        "telefone": "+244 912 999 000"
    })
    assert f_res.status_code == 201
    farmer_uuid = f_res.json()["uuid"]

    # 2. Executa análise de terra associada a este agricultor
    analysis_payload = {
        "latitude": -12.77,
        "longitude": 15.73,
        "area_hectares": 12.0,
        "cultura_atual": "Milho",
        "farmer_uuid": farmer_uuid,
        "nome": "Fazenda Auditada Candimba"
    }
    an_res = client.post("/api/v1/analyze", json=analysis_payload)
    assert an_res.status_code == 201
    analysis_id = an_res.json()["id"]

    # 3. Desativa o agricultor
    deact_res = client.patch(f"/api/v1/farmers/{farmer_uuid}/deactivate")
    assert deact_res.status_code == 200

    # 4. Consulta o histórico de análises do agricultor desativado
    analyses_res = client.get(f"/api/v1/farmers/{farmer_uuid}/analyses")
    assert analyses_res.status_code == 200
    analyses = analyses_res.json()
    assert len(analyses) >= 1
    assert any(a["id"] == analysis_id for a in analyses)

    # 5. Consulta individual da análise pelo UUID da análise
    get_an_res = client.get(f"/api/v1/analyses/{analysis_id}")
    assert get_an_res.status_code == 200
    assert get_an_res.json()["id"] == analysis_id
    assert get_an_res.json()["farmer_uuid"] == farmer_uuid
    assert get_an_res.json()["estimativa_carbono"]["creditos_liquidos_tco2e"] > 0


def test_deactivate_non_existent_farmer_returns_404(client):
    """Testa se desativar um agricultor com UUID inexistente retorna 404."""
    fake_uuid = str(uuid.uuid4())
    res_patch = client.patch(f"/api/v1/farmers/{fake_uuid}/deactivate")
    assert res_patch.status_code == 404

    res_del = client.delete(f"/api/v1/farmers/{fake_uuid}")
    assert res_del.status_code == 404


