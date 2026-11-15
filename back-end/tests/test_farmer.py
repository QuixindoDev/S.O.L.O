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
from src.application.use_cases.deactivate_farmer import DeactivateFarmerUseCase
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


def test_farmer_soft_delete_domain_methods():
    """Valida o campo is_active e métodos de domínio deactivate e activate."""
    farmer = Agricultor(
        nome_completo="António Kiala",
        telefone="+244 923 123 456"
    )
    # Por padrão deve estar ativo
    assert farmer.is_active is True
    assert farmer.to_dict()["is_active"] is True

    # Desativação lógica
    farmer.deactivate()
    assert farmer.is_active is False
    assert farmer.to_dict()["is_active"] is False

    # Reativação
    farmer.activate()
    assert farmer.is_active is True
    assert farmer.to_dict()["is_active"] is True


def test_deactivate_farmer_use_case_success_and_not_found():
    """Valida o caso de uso DeactivateFarmerUseCase para desativação lógica."""
    repo = SQLAlchemyLandAnalysisRepository()
    use_case = DeactivateFarmerUseCase(repository=repo)

    farmer_uuid = str(uuid.uuid4())
    farmer = Agricultor(
        id=farmer_uuid,
        nome_completo="Bernardo Gouveia",
        telefone="+244 944 555 666",
        cooperativa="Cooperativa do Bailundo"
    )
    repo.save_farmer(farmer)

    # Verifica que está ativo inicialmente
    stored = repo.find_farmer_by_uuid(farmer_uuid)
    assert stored is not None
    assert stored.is_active is True

    # Executa a desativação lógica
    updated_farmer = use_case.execute(farmer_uuid)
    assert updated_farmer.is_active is False
    assert updated_farmer.uuid == farmer_uuid

    # Confirma que no repositório o estado foi alterado para False
    stored_after = repo.find_farmer_by_uuid(farmer_uuid)
    assert stored_after is not None
    assert stored_after.is_active is False

    # Validação no banco de dados via ORM direto
    session: Session = SessionLocal()
    try:
        raw_record = session.query(FarmerRecord).filter(FarmerRecord.uuid == farmer_uuid).first()
        assert raw_record is not None
        assert raw_record.is_active is False
    finally:
        session.close()

    # Tentativa de desativar UUID inexistente deve lançar ValueError
    with pytest.raises(ValueError, match="não encontrado"):
        use_case.execute(str(uuid.uuid4()))


def test_farmer_repository_list_and_get_all_filters_inactive():
    """Valida que list_farmers e get_all_farmers filtram por defeito apenas is_active == True."""
    repo = SQLAlchemyLandAnalysisRepository()

    active_uuid = str(uuid.uuid4())
    inactive_uuid = str(uuid.uuid4())

    farmer_active = Agricultor(
        id=active_uuid,
        nome_completo="Agricultor Ativo Teste",
        telefone="+244 911 111 111",
        is_active=True
    )
    farmer_inactive = Agricultor(
        id=inactive_uuid,
        nome_completo="Agricultor Inativo Teste",
        telefone="+244 922 222 222",
        is_active=False
    )

    repo.save_farmer(farmer_active)
    repo.save_farmer(farmer_inactive)

    # 1. list_farmers padrão (only_active=True)
    active_list = repo.list_farmers(limit=100)
    active_uuids = [f.uuid for f in active_list]
    assert active_uuid in active_uuids
    assert inactive_uuid not in active_uuids

    # 2. get_all_farmers padrão (only_active=True)
    all_active = repo.get_all_farmers(limit=100)
    all_active_uuids = [f.uuid for f in all_active]
    assert active_uuid in all_active_uuids
    assert inactive_uuid not in all_active_uuids

    # 3. list_farmers incluindo inativos (only_active=False)
    all_farmers = repo.list_farmers(limit=100, only_active=False)
    all_uuids = [f.uuid for f in all_farmers]
    assert active_uuid in all_uuids
    assert inactive_uuid in all_uuids


def test_soft_deleted_farmer_preserves_carbon_and_land_history():
    """
    Requisito crítico de auditoria:
    A desativação do agricultor NUNCA apaga nem quebra o histórico de análises de satélite,
    dados de solo e créditos de carbono.
    """
    repo = SQLAlchemyLandAnalysisRepository()
    mock_satellite = MockGEEAdapter()
    analyze_use_case = AnalyzeLandUseCase(satellite_port=mock_satellite, repository=repo)
    deactivate_use_case = DeactivateFarmerUseCase(repository=repo)

    # 1. Cria agricultor e executa análise de créditos de carbono
    farmer_uuid = str(uuid.uuid4())
    farmer = Agricultor(
        id=farmer_uuid,
        nome_completo="Kassinda Luísa",
        telefone="+244 930 111 222",
        cooperativa="Associação de Camponeses do Huambo"
    )
    repo.save_farmer(farmer)

    diag = analyze_use_case.execute(
        latitude=-12.77,
        longitude=15.73,
        area_hectares=10.0,
        cultura_atual="Milho",
        farmer_uuid=farmer_uuid,
        nome_fazenda="Talhão Auditado de Carbono"
    )
    analysis_uuid = diag.id
    carbon_credits = diag.estimativa_carbono.creditos_liquidos_tco2e
    assert carbon_credits > 0

    # 2. Desativa o agricultor
    deactivated = deactivate_use_case.execute(farmer_uuid)
    assert deactivated.is_active is False

    # 3. Garante que as análises continuam acessíveis e intactas via repositório
    farmer_analyses = repo.find_by_farmer_uuid(farmer_uuid)
    assert len(farmer_analyses) >= 1
    found_analysis = next(a for a in farmer_analyses if a.id == analysis_uuid)
    assert found_analysis is not None
    assert found_analysis.estimativa_carbono.creditos_liquidos_tco2e == carbon_credits
    assert found_analysis.fazenda.nome == "Talhão Auditado de Carbono"

    # 4. Garante no banco de dados relacional que os registros persistem fisicamente
    session: Session = SessionLocal()
    try:
        raw_farmer = session.query(FarmerRecord).filter(FarmerRecord.uuid == farmer_uuid).first()
        assert raw_farmer is not None
        assert raw_farmer.is_active is False

        raw_analysis = session.query(LandAnalysisRecord).filter(LandAnalysisRecord.uuid == analysis_uuid).first()
        assert raw_analysis is not None
        assert raw_analysis.farmer_uuid == farmer_uuid
        assert raw_analysis.farmer_id == raw_farmer.id
        assert raw_analysis.creditos_liquidos_tco2e == carbon_credits
    finally:
        session.close()
