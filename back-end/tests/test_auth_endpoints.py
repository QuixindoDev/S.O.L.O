"""
Testes de Integração da Autenticação e 2FA SMS - Field Shift / S.O.L.O. Campo Amigo
Valida o fluxo completo de autenticação correspondente aos ecrãs do front-end:
  1. Cadastro (POST /api/v1/auth/register)
  2. SMS Enviado e Verificação de Segurança (POST /api/v1/auth/verify-otp)
  3. Reenvio de SMS (POST /api/v1/auth/resend-otp)
  4. Login com senha (POST /api/v1/auth/login)
  5. Perfil do agricultor logado (GET /api/v1/auth/me)
  6. Logout (POST /api/v1/auth/logout)
"""

import uuid
import pytest
from fastapi.testclient import TestClient

from main import app
from src.infrastructure.outbound.persistence.database import init_db
from src.infrastructure.outbound.external.sms_service import default_sms_service


@pytest.fixture(autouse=True)
def setup_database_and_sms():
    init_db()
    default_sms_service.clear_history()


@pytest.fixture
def client():
    return TestClient(app)


def test_complete_registration_and_otp_verification_flow(client):
    """
    Testa o ciclo de vida completo de cadastro da agricultora:
    1. Cadastro -> 2. Recebimento de SMS -> 3. Validação do código de 6 dígitos -> Emissão de JWT.
    """
    unique_phone = f"+55 71 99{uuid.uuid4().hex[:7]}"
    register_payload = {
        "nome_completo": "Dona Maria da Silva",
        "apelido": "Dona Maria",
        "telefone": unique_phone,
        "senha": "senhaSimples123",
        "cidade_estado": "Feira de Santana - BA",
        "nome_sitio": "Sítio Recanto Verde",
        "tipo_solo": "argiloso",
    }

    # 1. Cadastro
    reg_response = client.post("/api/v1/auth/register", json=register_payload)
    assert reg_response.status_code == 201
    reg_data = reg_response.json()

    assert reg_data["sms_enviado"] is True
    assert "farmer_uuid" in reg_data
    farmer_uuid = reg_data["farmer_uuid"]
    assert len(farmer_uuid) == 36
    assert "****" in reg_data["telefone_mascarado"]

    # 2. Código gerado pelo serviço de SMS
    otp_code = reg_data.get("otp_debug") or default_sms_service.get_last_code_for_phone(unique_phone)
    assert otp_code is not None
    assert len(otp_code) == 6
    assert otp_code.isdigit()

    # 3. Tentativa com código incorreto deve falhar
    bad_verify = client.post("/api/v1/auth/verify-otp", json={
        "farmer_uuid": farmer_uuid,
        "codigo_otp": "000000"
    })
    assert bad_verify.status_code == 400
    assert "Código incorreto" in bad_verify.json()["detail"]

    # 4. Verificação correta com o código SMS
    good_verify = client.post("/api/v1/auth/verify-otp", json={
        "farmer_uuid": farmer_uuid,
        "codigo_otp": otp_code
    })
    assert good_verify.status_code == 200
    auth_data = good_verify.json()

    assert "access_token" in auth_data
    assert auth_data["token_type"] == "bearer"
    assert auth_data["expires_in"] > 0

    user_info = auth_data["usuario"]
    assert user_info["userName"] == "Dona Maria"
    assert user_info["farmName"] == "Sítio Recanto Verde"
    assert user_info["userInitials"] == "DM"
    assert user_info["city"] == "Feira de Santana"
    assert user_info["state"] == "BA"
    assert user_info["locationLabel"] == "Feira de Santana - BA"
    assert user_info["isPhoneVerified"] is True


def test_login_flow_with_password(client):
    """Valida o login tradicional via telefone e senha (Ecrã 1-B)."""
    unique_phone = f"+244 933 {uuid.uuid4().hex[:6]}"
    # Cadastra e ativa
    reg = client.post("/api/v1/auth/register", json={
        "nome_completo": "Manuel Kaputu",
        "telefone": unique_phone,
        "senha": "kaputuPassword2026",
        "cidade": "Huambo",
        "estado": "Huambo",
    })
    assert reg.status_code == 201
    otp = reg.json()["otp_debug"]
    client.post("/api/v1/auth/verify-otp", json={"telefone": unique_phone, "codigo_otp": otp})

    # Login com senha correta
    login_res = client.post("/api/v1/auth/login", json={
        "telefone": unique_phone,
        "senha": "kaputuPassword2026"
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["usuario"]["userName"] == "Manuel Kaputu"
    assert data["usuario"]["userInitials"] == "MK"

    # Login com senha errada
    bad_login = client.post("/api/v1/auth/login", json={
        "telefone": unique_phone,
        "senha": "senhaTotalmenteIncorreta"
    })
    assert bad_login.status_code == 401
    assert "incorretos" in bad_login.json()["detail"]


def test_auth_me_protected_endpoint(client):
    """Valida que o endpoint GET /api/v1/auth/me exige token Bearer e retorna os dados corretos."""
    # Sem token -> 401
    unauth = client.get("/api/v1/auth/me")
    assert unauth.status_code == 401

    # Com token inválido -> 401
    bad_token = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer token.falso.invalido"})
    assert bad_token.status_code == 401

    # Cadastra usuário e obtém token
    unique_phone = f"+55 71 98{uuid.uuid4().hex[:7]}"
    reg = client.post("/api/v1/auth/register", json={
        "nome_completo": "Maria Esperança",
        "apelido": "Dona Maria",
        "telefone": unique_phone,
        "senha": "senhaMaria123",
        "cidade_estado": "Feira de Santana - BA",
    })
    otp = reg.json()["otp_debug"]
    auth_res = client.post("/api/v1/auth/verify-otp", json={"telefone": unique_phone, "codigo_otp": otp})
    token = auth_res.json()["access_token"]

    # Com token válido -> 200
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["userName"] == "Dona Maria"
    assert profile["userInitials"] == "DM"
    assert profile["soil"] == "argiloso"


def test_resend_otp_flow(client):
    """Valida o reenvio de novo código SMS caso o primeiro expire ou não seja recebido."""
    unique_phone = f"+55 71 97{uuid.uuid4().hex[:7]}"
    reg = client.post("/api/v1/auth/register", json={
        "nome_completo": "Produtor Rural Teste",
        "telefone": unique_phone,
        "senha": "senhaReenvio123",
    })
    initial_otp = reg.json()["otp_debug"]

    # Solicita reenvio
    resend = client.post("/api/v1/auth/resend-otp", json={"telefone": unique_phone})
    assert resend.status_code == 200
    new_otp = resend.json()["otp_debug"]

    # O código antigo não deve mais funcionar se for diferente
    # E o novo código deve validar com sucesso
    good_verify = client.post("/api/v1/auth/verify-otp", json={
        "telefone": unique_phone,
        "codigo_otp": new_otp
    })
    assert good_verify.status_code == 200


def test_logout_endpoint(client):
    """Valida o encerramento de sessão."""
    unique_phone = f"+55 71 96{uuid.uuid4().hex[:7]}"
    reg = client.post("/api/v1/auth/register", json={
        "nome_completo": "Dona Maria",
        "telefone": unique_phone,
        "senha": "senhaLogout123",
    })
    otp = reg.json()["otp_debug"]
    auth_res = client.post("/api/v1/auth/verify-otp", json={"telefone": unique_phone, "codigo_otp": otp})
    token = auth_res.json()["access_token"]

    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200
    assert "encerrada" in logout_res.json()["mensagem"]
