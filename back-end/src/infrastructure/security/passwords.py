"""
Módulo de Segurança e Criptografia - Field Shift / S.O.L.O. Campo Amigo
Implementa hashing seguro de senhas via bcrypt com salt automático e geração
criptograficamente segura de códigos de verificação OTP (2FA via SMS).
"""

import secrets
import hashlib
import bcrypt


def hash_password(password: str) -> str:
    """Gera um hash seguro da senha com salt bcrypt aleatório."""
    if not password:
        raise ValueError("A senha não pode ser vazia.")
    # Bcrypt requer bytes
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha em texto plano coincide com o hash bcrypt gravado."""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def generate_otp_code(digits: int = 6) -> str:
    """
    Gera um código OTP numérico criptograficamente seguro com a quantidade de dígitos solicitada.
    Por defeito: 6 dígitos (ex: '482910'), compatível com a tela de SMS 2FA do front-end.
    """
    if digits < 4 or digits > 10:
        raise ValueError("O tamanho do OTP deve estar entre 4 e 10 dígitos.")
    max_val = 10 ** digits
    num = secrets.randbelow(max_val)
    return f"{num:0{digits}d}"


def hash_otp(otp_code: str) -> str:
    """Gera um hash SHA-256 do código OTP para armazenamento temporário seguro."""
    return hashlib.sha256(otp_code.strip().encode("utf-8")).hexdigest()


def verify_otp(plain_otp: str, hashed_otp: str) -> bool:
    """Compara o código digitado com o hash armazenado usando comparação em tempo constante."""
    if not plain_otp or not hashed_otp:
        return False
    candidate_hash = hashlib.sha256(plain_otp.strip().encode("utf-8")).hexdigest()
    return secrets.compare_digest(candidate_hash, hashed_otp)
