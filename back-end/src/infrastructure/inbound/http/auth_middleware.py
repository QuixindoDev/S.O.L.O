"""
Middleware e Dependências de Autenticação - Field Shift / S.O.L.O. Campo Amigo
Protege rotas privadas validando tokens JWT Bearer e injetando o agricultor autenticado.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from src.infrastructure.security.tokens import decode_access_token
from src.infrastructure.outbound.persistence.models import FarmerRecord
from src.infrastructure.outbound.persistence.database import get_db
from sqlalchemy.orm import Session

# Esquema de autenticação Bearer para documentação OpenAPI
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_farmer(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> FarmerRecord:
    """
    Dependência FastAPI que autentica o agricultor pelo cabeçalho Authorization: Bearer <token>.
    Lança HTTPException 401 caso o token esteja ausente, inválido ou expirado.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação ausente. Por favor, inicie sessão.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido ou expirado: {str(ve)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    farmer_uuid = payload.get("sub")
    if not farmer_uuid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token malformado: identificador de utilizador ausente.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    farmer = db.query(FarmerRecord).filter(
        FarmerRecord.uuid == str(farmer_uuid)
    ).first()

    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Agricultor não encontrado no sistema.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not farmer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta conta de agricultor encontra-se desativada.",
        )

    return farmer


def get_optional_current_farmer(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> Optional[FarmerRecord]:
    """
    Dependência opcional: retorna o agricultor se o token for fornecido e válido,
    ou None se nenhum token for enviado.
    """
    if not credentials or not credentials.credentials:
        return None

    try:
        return get_current_farmer(credentials=credentials, db=db)
    except HTTPException:
        return None
