"""
Gerenciamento de Tokens JWT - Field Shift / S.O.L.O. Campo Amigo
Implementação nativa compatível com RFC 7519 (HMAC-SHA256) sem dependências externas.
"""

import os
import time
import json
import hmac
import hashlib
import base64
from datetime import timedelta
from typing import Dict, Any, Optional

# Chave secreta configurável por variável de ambiente
JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "field-shift-solo-jwt-secret-key-2026-safe-production-default"
)
JWT_ALGORITHM = "HS256"
# Por defeito: 7 dias de expiração (ideal para o agricultor não precisar logar repetidamente no campo)
DEFAULT_EXPIRE_MINUTES = 60 * 24 * 7


def _b64url_encode(data: bytes) -> str:
    """Codifica bytes em base64 url-safe sem padding de '='."""
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(s: str) -> bytes:
    """Decodifica string base64 url-safe restaurando o padding."""
    padding = 4 - (len(s) % 4)
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s.encode("utf-8"))


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
    secret_key: str = JWT_SECRET_KEY
) -> str:
    """
    Cria um token JWT assinado digitalmente com HMAC-SHA256.
    Inclui carimbos temporais iat (emitido em) e exp (expira em).
    """
    payload = data.copy()
    now = int(time.time())

    if expires_delta:
        expire_seconds = int(expires_delta.total_seconds())
    else:
        expire_seconds = DEFAULT_EXPIRE_MINUTES * 60

    payload["iat"] = now
    payload["exp"] = now + expire_seconds

    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}

    header_json = json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8")
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")

    header_b64 = _b64url_encode(header_json)
    payload_b64 = _b64url_encode(payload_json)

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_access_token(
    token: str,
    secret_key: str = JWT_SECRET_KEY
) -> Dict[str, Any]:
    """
    Valida e decodifica um token JWT.
    Lança ValueError caso o token esteja malformado, a assinatura seja inválida ou tenha expirado.
    """
    if not token or not isinstance(token, str):
        raise ValueError("Token vazio ou inválido.")

    parts = token.strip().split(".")
    if len(parts) != 3:
        raise ValueError("Formato de token JWT inválido (esperado 3 partes).")

    header_b64, payload_b64, sig_b64 = parts

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    expected_sig = hmac.new(secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    expected_sig_b64 = _b64url_encode(expected_sig)

    # Comparação em tempo constante para evitar timing attacks
    if not hmac.compare_digest(expected_sig_b64, sig_b64):
        raise ValueError("Assinatura do token inválida.")

    try:
        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception as exc:
        raise ValueError(f"Não foi possível decodificar o payload do token: {str(exc)}")

    # Verificação de expiração
    now = int(time.time())
    if "exp" in payload and payload["exp"] < now:
        raise ValueError("Token expirado.")

    return payload
