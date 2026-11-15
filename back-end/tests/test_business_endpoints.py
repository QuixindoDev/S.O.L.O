"""
Testes de Integração dos Módulos da Horta, Plantas, Finanças e Agrônoma
Field Shift / S.O.L.O. Campo Amigo
Valida o consumo das telas:
  - Minha Terra e Horta (GET /api/v1/horta, GET/POST /api/v1/plots)
  - Minhas Plantas (GET/POST /api/v1/plants, GET/POST /api/v1/harvests)
  - Meu Caderninho de Contas (GET /api/v1/finance/summary, GET/POST /api/v1/finance/transactions)
  - Falar com a Agrônoma (GET/POST /api/v1/agronomist/messages)
"""

import pytest
from fastapi.testclient import TestClient

from main import app
from src.infrastructure.outbound.persistence.database import init_db


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


@pytest.fixture
def client():
    return TestClient(app)


def test_horta_overview_returns_exact_structure(client):
    """Valida que o endpoint GET /api/v1/horta entrega a mesma estrutura de horta.json."""
    res = client.get("/api/v1/horta")
    assert res.status_code == 200
    data = res.json()

    assert "canteiros" in data
    assert "plantas" in data
    assert "colheitas" in data

    # Validação de Canteiros
    assert len(data["canteiros"]) >= 3
    c_names = [c["name"] for c in data["canteiros"]]
    assert "Canteiro Principal" in c_names
    assert "Horta da Cozinha" in c_names
    assert "Baixa do Riacho" in c_names

    p_names = [p["name"] for p in data["plantas"]]
    assert "Tomate Cereja" in p_names
    assert "Alface" in p_names
    assert "Couve" in p_names

    # Validação de Colheitas
    crops = [h["crop"] for h in data["colheitas"]]
    assert "Alface" in crops


def test_plots_creation_and_listing(client):
    """Valida a listagem e criação de novos canteiros."""
    list_res = client.get("/api/v1/plots")
    assert list_res.status_code == 200
    initial_count = len(list_res.json())

    # Criar novo canteiro
    new_plot = {
        "name": "Canteiro de Ervas Medicinais",
        "crops": "Hortelã, Alecrim e Boldo",
        "areaM2": 35.0,
        "icon": "leaf",
        "soilTexture": "arenoso",
    }
    create_res = client.post("/api/v1/plots", json=new_plot)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["name"] == "Canteiro de Ervas Medicinais"
    assert created["areaM2"] == 35.0

    # Confirma listagem atualizada
    after_list = client.get("/api/v1/plots").json()
    assert len(after_list) == initial_count + 1


def test_plants_creation(client):
    """Valida a adição de uma nova planta ao canteiro."""
    new_plant = {
        "name": "Pimenta Dedo-de-Moça",
        "plotId": "canteiro_principal",
        "icon": "sprout",
        "care": "Rega moderada e sol pleno",
        "status": "Crescendo",
        "tone": "primary",
        "sowingDate": "20261101",
        "harvestInDays": 40,
    }
    res = client.post("/api/v1/plants", json=new_plant)
    assert res.status_code == 201
    plant_data = res.json()
    assert plant_data["name"] == "Pimenta Dedo-de-Moça"
    assert plant_data["harvestInDays"] == 40


def test_harvests_creation(client):
    """Valida o registro de uma nova colheita."""
    new_harvest = {
        "crop": "Milho Verde",
        "quantity": "50 espigas",
        "soldAt": "feira",
        "date": "20261115",
    }
    res = client.post("/api/v1/harvests", json=new_harvest)
    assert res.status_code == 201
    h_data = res.json()
    assert h_data["crop"] == "Milho Verde"
    assert h_data["quantity"] == "50 espigas"


def test_financial_summary_and_transaction_flow(client):
    """Valida o cálculo do resumo do Caderninho de Contas e inserção de novas transações."""
    # 1. Resumo atual
    sum_res = client.get("/api/v1/finance/summary")
    assert sum_res.status_code == 200
    summary = sum_res.json()

    assert "dinheiroQueEntrou" in summary
    assert "dinheiroQueSaiu" in summary
    assert "sobrou" in summary
    assert summary["dinheiroQueEntrou"] >= 1480.00
    assert summary["dinheiroQueSaiu"] >= 620.50

    # 2. Adicionar nova venda na feira
    nova_venda = {
        "tipo": "entrada",
        "categoria": "feira",
        "descricao": "Venda de coentro e salsinha",
        "valor": 120.00,
        "data": "15 de nov",
    }
    tx_res = client.post("/api/v1/finance/transactions", json=nova_venda)
    assert tx_res.status_code == 201
    assert tx_res.json()["valor"] == 120.00

    # 3. Recalcular e verificar novo saldo
    new_summary = client.get("/api/v1/finance/summary").json()
    assert new_summary["dinheiroQueEntrou"] == summary["dinheiroQueEntrou"] + 120.00
    assert new_summary["sobrou"] == summary["sobrou"] + 120.00


def test_agronomist_messages_flow(client):
    """Valida o chat de dúvidas com a agrônoma."""
    # 1. Listar mensagens existentes
    msgs_res = client.get("/api/v1/agronomist/messages")
    assert msgs_res.status_code == 200
    msgs = msgs_res.json()
    assert len(msgs) >= 4
    assert any("Baixa do Riacho" in m["message"] for m in msgs)

    # 2. Enviar nova dúvida
    send_res = client.post("/api/v1/agronomist/messages", json={
        "message": "Quando devo aplicar o adubo na couve?"
    })
    assert send_res.status_code == 201
    sent = send_res.json()
    assert sent["sender"] == "farmer"
    assert sent["message"] == "Quando devo aplicar o adubo na couve?"
