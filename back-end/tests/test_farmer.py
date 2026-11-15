"""
Testes Unitários e de Integração da Entidade Agricultor (Farmer) - Field Shift
Valida regras de domínio, persistência ORM e relação 1:N com análises de terras.
"""

import uuid
import pytest
from sqlalchemy.orm import Session

from src.domain.entities import Agricultor
from src.infrastructure.outbound.persistence.database import init_db, SessionLocal
from src.infrastructure.outbound.persistence.models import FarmerRecord, LandAnalysisRecord
from src.infrastructure.outbound.persistence.postgres_repository import SQLAlchemyLandAnalysisRepository
from src.application.use_cases.analyze_land import AnalyzeLandUseCase
from src.infrastructure.outbound.external.gee_adapter import MockGEEAdapter


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_agricultor_domain_entity_validation():
    """Valida as regras de negócio puras da entidade Agricultor."""
    # Instanciação válida
    farmer = Agricultor(
        nome_completo="  Manuel Kaputu  ",
        telefone="  +244 923 111 222  ",
        cooperativa="Cooperativa do Huambo",
        bilhete_identidade_ou_codigo="004821HA"
    )
    assert farmer.nome_completo == "Manuel Kaputu"
    assert farmer.telefone == "+244 923 111 222"
    assert len(farmer.uuid) == 36
    assert farmer.id == farmer.uuid

    dict_repr = farmer.to_dict()
    assert dict_repr["nome_completo"] == "Manuel Kaputu"
    assert dict_repr["uuid"] == farmer.uuid
    assert dict_repr["cooperativa"] == "Cooperativa do Huambo"

    # Nome vazio deve falhar
    with pytest.raises(ValueError, match="nome completo"):
        Agricultor(nome_completo="   ", telefone="+244900000000")

    # Telefone vazio deve falhar
    with pytest.raises(ValueError, match="telefone"):
        Agricultor(nome_completo="Manuel", telefone="  ")


def test_farmer_persistence_and_repository():
    """Valida gravação, busca por UUID e listagem no repositório SQLAlchemy."""
    repo = SQLAlchemyLandAnalysisRepository()
    custom_uuid = str(uuid.uuid4())

    agricultor = Agricultor(
        id=custom_uuid,
        nome_completo="João Baptista Chivela",
        telefone="+244 912 345 678",
        cooperativa="Associação de Camponeses de Cachiungo",
        bilhete_identidade_ou_codigo="BI-9988-HU"
    )

    saved_uuid = repo.save_farmer(agricultor)
    assert saved_uuid == custom_uuid

    # Recuperar por UUID
    retrieved = repo.find_farmer_by_uuid(custom_uuid)
    assert retrieved is not None
    assert retrieved.uuid == custom_uuid
    assert retrieved.nome_completo == "João Baptista Chivela"
    assert retrieved.telefone == "+244 912 345 678"

    # Validar chave primária Integer interna no banco
    session: Session = SessionLocal()
    try:
        raw_record = session.query(FarmerRecord).filter(FarmerRecord.uuid == custom_uuid).first()
        assert raw_record is not None
        assert isinstance(raw_record.id, int)
        assert raw_record.id >= 1
    finally:
        session.close()

    # Listar agricultores
    farmers_list = repo.list_farmers(limit=10, offset=0)
    assert len(farmers_list) >= 1
    assert any(f.uuid == custom_uuid for f in farmers_list)


def test_farmer_one_to_many_analyses_relationship():
    """Valida que um agricultor pode ter múltiplas análises de terra associadas (1:N)."""
    repo = SQLAlchemyLandAnalysisRepository()
    mock_satellite = MockGEEAdapter()
    use_case = AnalyzeLandUseCase(satellite_port=mock_satellite, repository=repo)

    # 1. Cadastra agricultor
    farmer_uuid = str(uuid.uuid4())
    agricultor = Agricultor(
        id=farmer_uuid,
        nome_completo="Dona Teresa Samba",
        telefone="+244 933 444 555",
        cooperativa="Cooperativa Mulheres da Terra"
    )
    repo.save_farmer(agricultor)

    # 2. Executa primeira análise (Parcela de Milho)
    diag1 = use_case.execute(
        latitude=-12.77,
        longitude=15.73,
        area_hectares=3.5,
        cultura_atual="Milho",
        farmer_uuid=farmer_uuid,
        nome_fazenda="Parcela Norte - Milho"
    )

    # 3. Executa segunda análise (Parcela de Mandioca)
    diag2 = use_case.execute(
        latitude=-12.79,
        longitude=15.75,
        area_hectares=7.0,
        cultura_atual="Mandioca",
        farmer_uuid=farmer_uuid,
        nome_fazenda="Parcela Sul - Mandioca"
    )

    # 4. Busca análises do agricultor através do método dedicado
    farmer_analyses = repo.find_by_farmer_uuid(farmer_uuid)
    assert len(farmer_analyses) == 2
    analysis_ids = [a.id for a in farmer_analyses]
    assert diag1.id in analysis_ids
    assert diag2.id in analysis_ids

    # 5. Verifica relação ORM direta no SQLAlchemy
    session: Session = SessionLocal()
    try:
        farmer_rec = session.query(FarmerRecord).filter(FarmerRecord.uuid == farmer_uuid).first()
        assert farmer_rec is not None
        assert len(farmer_rec.analyses) == 2
        for an_rec in farmer_rec.analyses:
            assert an_rec.farmer_id == farmer_rec.id
            assert an_rec.farmer_uuid == farmer_uuid
            assert an_rec.farmer.nome_completo == "Dona Teresa Samba"
    finally:
        session.close()
