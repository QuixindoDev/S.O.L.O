"""
Testes Unitários da Camada de Segurança e Criptografia (Fase 1) - Field Shift
Valida o hashing de senhas via bcrypt, a comparação segura e a geração de códigos OTP para 2FA.
"""

import pytest
from src.infrastructure.security.passwords import (
    hash_password,
    verify_password,
    generate_otp_code,
    hash_otp,
    verify_otp,
)


def test_password_hashing_and_verification():
    """Valida que o hash bcrypt é gerado com salt e valida senhas corretas e incorretas."""
    raw_password = "SenhaForteCampo2026!"
    hashed = hash_password(raw_password)

    # O hash bcrypt deve começar com $2b$ ou $2a$
    assert hashed.startswith("$2")
    assert hashed != raw_password

    # Senha correta deve passar
    assert verify_password(raw_password, hashed) is True

    # Senha incorreta deve falhar
    assert verify_password("SenhaErrada!", hashed) is False
    assert verify_password("", hashed) is False
    assert verify_password(raw_password, "") is False


def test_empty_password_raises_value_error():
    """Valida que senhas vazias são rejeitadas na geração de hash."""
    with pytest.raises(ValueError, match="vazia"):
        hash_password("")


def test_otp_generation_and_verification():
    """Valida a geração de códigos numéricos de 6 dígitos para o 2FA via SMS."""
    # Gera 20 códigos e valida características
    codigos = set()
    for _ in range(20):
        otp = generate_otp_code(6)
        assert len(otp) == 6
        assert otp.isdigit()
        codigos.add(otp)

    # Aleatoriedade: não devem ser todos iguais
    assert len(codigos) > 1

    # Validação do hash do OTP
    sample_otp = "482910"
    otp_hash = hash_otp(sample_otp)
    assert len(otp_hash) == 64  # SHA-256 hex string

    # Verificação de código correto
    assert verify_otp(sample_otp, otp_hash) is True
    assert verify_otp(" 482910 ", otp_hash) is True  # com trim de espaço

    # Verificação de código incorreto
    assert verify_otp("000000", otp_hash) is False
    assert verify_otp("", otp_hash) is False
