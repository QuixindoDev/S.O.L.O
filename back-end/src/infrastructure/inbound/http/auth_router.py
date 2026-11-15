"""
Rotas HTTP de Autenticação e Segurança (S.O.L.O. Campo Amigo)
Implementa os endpoints consumidos pelos ecrãs de autenticação:
  - 1. Cadastro (Criar sua Conta Grátis)
  - 1-B. Entrar na minha conta (Login)
  - 2. SMS Enviado (Disparo de OTP)
  - 3. Verificação de Segurança (2FA OTP)
  - Identidade do Usuário Logado (/auth/me) e Logout
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.infrastructure.inbound.http.schemas import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    VerifyOtpRequest,
    ResendOtpRequest,
    AuthTokenResponse,
    UserProfileResponse,
)
from src.infrastructure.inbound.http.auth_middleware import get_current_farmer
from src.infrastructure.security.passwords import (
    hash_password,
    verify_password,
    generate_otp_code,
    hash_otp,
    verify_otp,
)
from src.infrastructure.security.tokens import create_access_token
from src.infrastructure.outbound.external.sms_service import (
    default_sms_service,
    mask_phone_number,
)
from src.infrastructure.outbound.persistence.models import FarmerRecord
from src.infrastructure.outbound.persistence.database import get_db

auth_router = APIRouter(prefix="/api/v1/auth", tags=["Autenticação & 2FA (S.O.L.O.)"])


def _extract_initials(name: str) -> str:
    """Extrai as iniciais do nome (ex: 'Dona Maria' -> 'DM', 'João Chivela' -> 'JC')."""
    parts = [p.strip() for p in name.strip().split() if p.strip()]
    if not parts:
        return "AG"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return f"{parts[0][0]}{parts[-1][0]}".upper()


def _format_user_profile(farmer: FarmerRecord) -> UserProfileResponse:
    """Formata o perfil do agricultor compatível com os tipos do front-end."""
    user_name = farmer.apelido or farmer.nome_completo
    farm_name = farmer.nome_sitio or "Sítio Recanto Verde"
    initials = _extract_initials(user_name)

    city = farmer.cidade or "Feira de Santana"
    state = farmer.estado or "BA"
    location_label = f"{city} - {state}" if city and state else "Feira de Santana - BA"

    return UserProfileResponse(
        id=farmer.uuid,
        uuid=farmer.uuid,
        userName=user_name,
        farmName=farm_name,
        userInitials=initials,
        city=city,
        state=state,
        locationLabel=location_label,
        latitude=farmer.latitude_padrao or -12.97,
        longitude=farmer.longitude_padrao or -39.51,
        soil=farmer.tipo_solo or "argiloso",
        phone=farmer.telefone,
        isPhoneVerified=bool(farmer.is_phone_verified),
        cooperativa=farmer.cooperativa,
    )


@auth_router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Conta Grátis (Ecrã 1)",
    description="Regista a agricultora, encripta a senha com bcrypt e envia código SMS de 6 dígitos."
)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    clean_phone = request.telefone.strip()
    clean_digits = "".join(filter(str.isdigit, clean_phone))

    # 1. Verificar se o número de telefone já está registrado
    existing = db.query(FarmerRecord).filter(
        FarmerRecord.telefone == clean_phone
    ).first()

    if not existing and clean_digits:
        for f in db.query(FarmerRecord).all():
            if "".join(filter(str.isdigit, f.telefone)) == clean_digits:
                existing = f
                break

    if existing and existing.is_phone_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este número de telefone já está cadastrado. Por favor, entre na sua conta.",
        )

    # 2. Processar cidade e estado caso tenham vindo juntos ("Feira de Santana - BA")
    cidade = request.cidade
    estado = request.estado
    if not cidade and request.cidade_estado:
        parts = request.cidade_estado.split("-")
        cidade = parts[0].strip()
        if len(parts) > 1:
            estado = parts[1].strip()

    # 3. Gerar hash seguro de senha e código OTP de 6 dígitos
    pwd_hash = hash_password(request.senha)
    otp_code = generate_otp_code(6)
    otp_hash = hash_otp(otp_code)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=10)

    if existing and not existing.is_phone_verified:
        # Reutiliza o registro pendente não verificado
        farmer = existing
        farmer.nome_completo = request.nome_completo.strip()
        farmer.apelido = request.apelido.strip() if request.apelido else None
        farmer.cidade = cidade
        farmer.estado = estado
        farmer.nome_sitio = request.nome_sitio
        farmer.tipo_solo = request.tipo_solo or "argiloso"
        farmer.password_hash = pwd_hash
        farmer.otp_code_hash = otp_hash
        farmer.otp_expires_at = expires_at
        farmer.otp_attempts = 0
    else:
        # Cria novo registro
        farmer = FarmerRecord(
            nome_completo=request.nome_completo.strip(),
            apelido=request.apelido.strip() if request.apelido else None,
            telefone=clean_phone,
            cidade=cidade,
            estado=estado,
            nome_sitio=request.nome_sitio,
            tipo_solo=request.tipo_solo or "argiloso",
            cooperativa=request.cooperativa,
            password_hash=pwd_hash,
            otp_code_hash=otp_hash,
            otp_expires_at=expires_at,
            otp_attempts=0,
            is_phone_verified=False,
            is_active=True,
        )
        db.add(farmer)

    db.commit()
    db.refresh(farmer)

    # 4. Enviar SMS com o código OTP
    default_sms_service.send_verification_code(clean_phone, otp_code)

    return RegisterResponse(
        mensagem="Conta criada com sucesso! Enviamos um SMS com o seu código de segurança.",
        farmer_uuid=farmer.uuid,
        telefone_mascarado=mask_phone_number(clean_phone),
        sms_enviado=True,
        proximo_passo="Digite o código de 6 números do SMS para abrir o seu caderno.",
        otp_debug=otp_code,
    )


@auth_router.post(
    "/verify-otp",
    response_model=AuthTokenResponse,
    summary="Verificação de Segurança 2FA (Ecrã 3)",
    description="Valida o código de 6 dígitos enviado por SMS e emite o token de acesso Bearer JWT."
)
def verify_otp_endpoint(request: VerifyOtpRequest, db: Session = Depends(get_db)):
    farmer: Optional[FarmerRecord] = None

    if request.farmer_uuid:
        farmer = db.query(FarmerRecord).filter(
            FarmerRecord.uuid == request.farmer_uuid.strip()
        ).first()

    if not farmer and request.telefone:
        clean_target = "".join(filter(str.isdigit, request.telefone))
        for f in db.query(FarmerRecord).all():
            if "".join(filter(str.isdigit, f.telefone)) == clean_target:
                farmer = f
                break

    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta de agricultor não encontrada para verificação.",
        )

    # Proteção contra ataques de força bruta
    if (farmer.otp_attempts or 0) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas incorretas. Por segurança, solicite um novo código por SMS.",
        )

    # Verificação de expiração temporal
    now = datetime.now(timezone.utc)
    if not farmer.otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum código pendente de validação. Solicite o reenvio.",
        )

    expires_at = farmer.otp_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O código de verificação expirou. Por favor, toque em reenviar código.",
        )

    # Comparação criptográfica segura em tempo constante
    if not verify_otp(request.codigo_otp, farmer.otp_code_hash or ""):
        farmer.otp_attempts = (farmer.otp_attempts or 0) + 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código incorreto. Digite os 6 números recebidos nas mensagens normais do celular.",
        )

    # Código correto: marca telefone como verificado e limpa estado temporário
    farmer.is_phone_verified = True
    farmer.otp_code_hash = None
    farmer.otp_expires_at = None
    farmer.otp_attempts = 0
    db.commit()
    db.refresh(farmer)

    # Emissão de token JWT
    token_payload = {
        "sub": farmer.uuid,
        "phone": farmer.telefone,
        "name": farmer.nome_completo,
    }
    token = create_access_token(token_payload)

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=7 * 24 * 3600,
        usuario=_format_user_profile(farmer).model_dump(),
    )


@auth_router.post(
    "/resend-otp",
    response_model=RegisterResponse,
    summary="Reenviar Código SMS (Ecrã 2)",
    description="Gera um novo código de 6 dígitos e reenvia por SMS."
)
def resend_otp(request: ResendOtpRequest, db: Session = Depends(get_db)):
    farmer: Optional[FarmerRecord] = None

    if request.farmer_uuid:
        farmer = db.query(FarmerRecord).filter(
            FarmerRecord.uuid == request.farmer_uuid.strip()
        ).first()

    if not farmer and request.telefone:
        clean_target = "".join(filter(str.isdigit, request.telefone))
        for f in db.query(FarmerRecord).all():
            if "".join(filter(str.isdigit, f.telefone)) == clean_target:
                farmer = f
                break

    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agricultor não encontrado.",
        )

    # Gera novo código
    otp_code = generate_otp_code(6)
    farmer.otp_code_hash = hash_otp(otp_code)
    farmer.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    farmer.otp_attempts = 0
    db.commit()

    default_sms_service.send_verification_code(farmer.telefone, otp_code)

    return RegisterResponse(
        mensagem="Novo código de segurança enviado com sucesso!",
        farmer_uuid=farmer.uuid,
        telefone_mascarado=mask_phone_number(farmer.telefone),
        sms_enviado=True,
        proximo_passo="Digite o novo código de 6 números enviado por SMS.",
        otp_debug=otp_code,
    )


@auth_router.post(
    "/login",
    response_model=AuthTokenResponse,
    summary="Entrar na Minha Conta (Ecrã 1-B)",
    description="Autentica com telefone e senha e emite o token Bearer JWT."
)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    clean_target = "".join(filter(str.isdigit, request.telefone))
    farmer: Optional[FarmerRecord] = None

    # Busca por igualdade exata ou dígitos
    farmer = db.query(FarmerRecord).filter(
        FarmerRecord.telefone == request.telefone.strip()
    ).first()

    if not farmer and clean_target:
        for f in db.query(FarmerRecord).all():
            if "".join(filter(str.isdigit, f.telefone)) == clean_target:
                farmer = f
                break

    if not farmer or not farmer.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Número de telefone ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(request.senha, farmer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Número de telefone ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not farmer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta conta de agricultor foi desativada.",
        )

    # Emissão de token JWT
    token_payload = {
        "sub": farmer.uuid,
        "phone": farmer.telefone,
        "name": farmer.nome_completo,
    }
    token = create_access_token(token_payload)

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=7 * 24 * 3600,
        usuario=_format_user_profile(farmer).model_dump(),
    )


@auth_router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Perfil do Usuário Autenticado",
    description="Retorna dados da agricultora conectada para alimentar a barra lateral e cabeçalho."
)
def get_me(current_farmer: FarmerRecord = Depends(get_current_farmer)):
    return _format_user_profile(current_farmer)


@auth_router.post(
    "/logout",
    summary="Sair da Conta (Sidebar)",
    description="Encerra a sessão ativa."
)
def logout(current_farmer: FarmerRecord = Depends(get_current_farmer)):
    return {
        "mensagem": f"Sessão de {current_farmer.apelido or current_farmer.nome_completo} encerrada com sucesso."
    }
