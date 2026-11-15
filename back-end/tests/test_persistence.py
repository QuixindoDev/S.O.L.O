"""
Testes Unitários da Camada de Persistência e Repositório - Field Shift
Valida a regra arquitetural crítica:
- Chave primária interna numérica (Integer, autoincrement)
- UUID único para comunicação externa
"""

import uuid
from datetime import datetime, timezone
import pytest
from sqlalchemy.orm import Session

from src.infrastructure.outbound.persistence.database import init_db, SessionLocal, engine
from src.infrastructure.outbound.persistence.models import (
    LandAnalysisRecord,
    FarmerRecord,
    PlotRecord,
    PlantRecord,
    HarvestRecord,
    FinancialRecord,
    AgronomistMessageRecord,
    NasaCacheRecord,
)
from src.infrastructure.outbound.persistence.postgres_repository import SQLAlchemyLandAnalysisRepository
from src.domain.entities import (
    DiagnosticoCompleto,
    Fazenda,
    MetricasSatelite,
    AnaliseSolo,
    RecomendacaoRotacao,
    EstimativaCarbono,
)


@pytest.fixture(autouse=True)
def setup_database():
    """Garante tabelas criadas antes de cada teste."""
    init_db()
    yield


def _criar_diagnostico_exemplo(custom_uuid: str = None) -> DiagnosticoCompleto:
    target_uuid = custom_uuid or str(uuid.uuid4())
    fazenda_uuid = str(uuid.uuid4())
    return DiagnosticoCompleto(
        id=target_uuid,
        fazenda=Fazenda(
            id=fazenda_uuid,
            nome="Fazenda Teste Benguela",
            latitude=-12.58,
            longitude=13.41,
            area_hectares=10.0,
            cultura_atual="Milho",
            localizacao_descricao="Benguela, Angola"
        ),
        metricas_satelite=MetricasSatelite(
            ndvi=0.32,
            humidade_solo=0.22,
            precipitacao=750.0,
            elevacao=600.0,
            temperatura_media=24.5,
            fonte_dados="NASA POWER / GEE"
        ),
        analise_solo=AnaliseSolo(
            score_saude=45.0,
            classificacao_saude="Degradado",
            indice_ndvi=0.32,
            humidade_solo=0.22,
            precipitacao_anual=750.0,
            elevacao_metros=600.0,
            risco_erosao="Médio",
            diagnostico_detalhado="Solo sob estresse moderado e depleo de N."
        ),
        rotacao_principal=RecomendacaoRotacao(
            cultura_recomendada="Feijão-frade",
            nome_cientifico="Vigna unguiculata",
            justificativa="Fixação biológica de nitrogénio via simbiose com Rhizobium.",
            beneficio_ecologico="Restauração de fertilidade natural e ciclagem de nutrientes.",
            taxa_sequestro_adicional=1.25,
            compatibilidade_clima="Alta para o clima de Angola"
        ),
        alternativas_rotacao=[
            RecomendacaoRotacao(
                cultura_recomendada="Amendoim (Ginguba)",
                nome_cientifico="Arachis hypogaea",
                justificativa="Fixação de N2 e geração de renda imediata.",
                beneficio_ecologico="Cobertura de solo densa contra erosão.",
                taxa_sequestro_adicional=1.10,
                compatibilidade_clima="Alta"
            )
        ],
        estimativa_carbono=EstimativaCarbono(
            area_hectares=10.0,
            taxa_sequestro=1.25,
            fator_conversao_co2=3.67,
            margem_seguranca=0.20,
            preco_por_credito_usd=20.0
        ),
        gerado_em=datetime.now(timezone.utc)
    )


def test_schema_model_id_is_integer_and_uuid_is_string():
    """Valida que o modelo SQLAlchemy possui id (Integer PK) e uuid (String única)."""
    assert hasattr(LandAnalysisRecord, "id")
    assert hasattr(LandAnalysisRecord, "uuid")
    assert hasattr(LandAnalysisRecord, "fazenda_uuid")
    assert hasattr(LandAnalysisRecord, "farmer_id")
    assert hasattr(LandAnalysisRecord, "farmer_uuid")

    # Verifica tipo das colunas
    col_id = LandAnalysisRecord.__table__.columns["id"]
    col_uuid = LandAnalysisRecord.__table__.columns["uuid"]
    col_farmer_id = LandAnalysisRecord.__table__.columns["farmer_id"]

    assert col_id.primary_key is True
    # O tipo do id deve ser Integer
    from sqlalchemy import Integer, String
    assert isinstance(col_id.type, Integer)
    assert isinstance(col_uuid.type, String)
    assert isinstance(col_farmer_id.type, Integer)
    assert col_uuid.unique is True


def test_repository_save_and_retrieve_by_uuid():
    """Verifica gravação e recuperação usando o UUID público."""
    repo = SQLAlchemyLandAnalysisRepository()
    expected_uuid = str(uuid.uuid4())
    diag = _criar_diagnostico_exemplo(custom_uuid=expected_uuid)

    saved_uuid = repo.save(diag)
    assert saved_uuid == expected_uuid

    # Recupera via find_by_uuid
    retrieved = repo.find_by_uuid(expected_uuid)
    assert retrieved is not None
    assert retrieved.id == expected_uuid
    assert retrieved.uuid == expected_uuid
    assert retrieved.fazenda.nome == "Fazenda Teste Benguela"
    assert retrieved.rotacao_principal.cultura_recomendada == "Feijão-frade"

    # Confirma diretamente na base de dados que id é um inteiro sequencial
    session: Session = SessionLocal()
    try:
        raw_record = session.query(LandAnalysisRecord).filter(
            LandAnalysisRecord.uuid == expected_uuid
        ).first()
        assert raw_record is not None
        assert isinstance(raw_record.id, int)
        assert raw_record.id >= 1
        assert raw_record.uuid == expected_uuid
    finally:
        session.close()


def test_repository_list_recent():
    """Verifica paginação e listagem de registros recentes."""
    repo = SQLAlchemyLandAnalysisRepository()
    for _ in range(3):
        repo.save(_criar_diagnostico_exemplo())

    recentes = repo.list_recent(limit=2, offset=0)
    assert len(recentes) == 2
    for r in recentes:
        assert isinstance(r.id, str)
        # O id exposto deve ser um UUID válido
        assert len(r.id) == 36


def test_phase1_models_schema_integrity():
    """Valida a conformidade de todos os novos modelos ORM da Fase 1 com PK Integer e UUID String."""
    from sqlalchemy import Integer, String

    models = [
        FarmerRecord,
        PlotRecord,
        PlantRecord,
        HarvestRecord,
        FinancialRecord,
        AgronomistMessageRecord,
    ]

    for model in models:
        col_id = model.__table__.columns["id"]
        col_uuid = model.__table__.columns["uuid"]
        assert col_id.primary_key is True
        assert isinstance(col_id.type, Integer)
        assert isinstance(col_uuid.type, String)
        assert col_uuid.unique is True

    # NasaCacheRecord usa cache_key como chave única além de id PK
    assert NasaCacheRecord.__table__.columns["id"].primary_key is True
    assert isinstance(NasaCacheRecord.__table__.columns["id"].type, Integer)
    assert NasaCacheRecord.__table__.columns["cache_key"].unique is True


def test_plots_and_plants_relational_persistence():
    """Valida o relacionamento 1:N entre Agricultor, Canteiros (Plots) e Plantas."""
    session: Session = SessionLocal()
    try:
        farmer = FarmerRecord(
            nome_completo="Maria da Silva",
            apelido="Dona Maria",
            telefone="+55 71 99123-4567",
            cidade="Feira de Santana",
            estado="BA",
            nome_sitio="Sítio Recanto Verde",
            tipo_solo="argiloso",
            latitude_padrao=-12.97,
            longitude_padrao=-39.51,
        )
        session.add(farmer)
        session.flush()

        plot = PlotRecord(
            farmer_id=farmer.id,
            farmer_uuid=farmer.uuid,
            name="Canteiro Principal",
            slug="canteiro_principal",
            crops_description="Alface, Couve e Tomate Cereja",
            area_m2=120.0,
            icon="sprout",
            soil_texture="argiloso",
        )
        session.add(plot)
        session.flush()

        plant1 = PlantRecord(
            plot_id=plot.id,
            plot_uuid=plot.uuid,
            name="Tomate Cereja",
            slug="tomate_cereja",
            status="Florindo",
            care="Precisa de estaca agora",
            tone="primary",
            sowing_date="20260920",
            harvest_in_days=12,
        )
        plant2 = PlantRecord(
            plot_id=plot.id,
            plot_uuid=plot.uuid,
            name="Alface",
            slug="alface",
            status="Pronta",
            care="Pode colher em 3 dias",
            tone="primary",
            sowing_date="20261028",
            harvest_in_days=3,
        )
        session.add_all([plant1, plant2])
        session.commit()

        # Consulta reversa a partir do canteiro
        queried_plot = session.query(PlotRecord).filter(PlotRecord.uuid == plot.uuid).first()
        assert queried_plot is not None
        assert len(queried_plot.plants) == 2
        plant_names = [p.name for p in queried_plot.plants]
        assert "Tomate Cereja" in plant_names
        assert "Alface" in plant_names
        assert queried_plot.farmer.apelido == "Dona Maria"
    finally:
        session.close()


def test_financial_records_and_harvests_persistence():
    """Valida o armazenamento de movimentações do Caderninho de Contas e histórico de Colheitas."""
    session: Session = SessionLocal()
    try:
        farmer = FarmerRecord(
            nome_completo="Dona Maria",
            telefone="+5571991234567",
        )
        session.add(farmer)
        session.flush()

        # Adicionar lançamentos financeiros
        entrada = FinancialRecord(
            farmer_id=farmer.id,
            farmer_uuid=farmer.uuid,
            tipo="entrada",
            categoria="feira",
            descricao="Venda de alface na feira",
            valor=240.0,
            data="12 de nov",
        )
        saida = FinancialRecord(
            farmer_id=farmer.id,
            farmer_uuid=farmer.uuid,
            tipo="saida",
            categoria="adubo",
            descricao="Compra de adubo",
            valor=185.0,
            data="10 de nov",
        )
        session.add_all([entrada, saida])

        # Adicionar colheita
        colheita = HarvestRecord(
            farmer_id=farmer.id,
            farmer_uuid=farmer.uuid,
            crop_name="Alface",
            quantity="12 cabeças",
            sold_at="feira",
            harvest_date="20261114",
        )
        session.add(colheita)
        session.commit()

        # Consultar finanças do agricultor
        records = session.query(FinancialRecord).filter(FinancialRecord.farmer_uuid == farmer.uuid).all()
        assert len(records) == 2
        entradas = sum(r.valor for r in records if r.tipo == "entrada")
        saidas = sum(r.valor for r in records if r.tipo == "saida")
        saldo = entradas - saidas
        assert saldo == pytest.approx(55.0)

        # Consultar colheitas
        harvests = session.query(HarvestRecord).filter(HarvestRecord.farmer_uuid == farmer.uuid).all()
        assert len(harvests) == 1
        assert harvests[0].quantity == "12 cabeças"
    finally:
        session.close()


def test_agronomist_messages_and_nasa_cache_persistence():
    """Valida o canal com a agrônoma e a camada de cache para a API da NASA."""
    session: Session = SessionLocal()
    try:
        farmer = FarmerRecord(
            nome_completo="Dona Maria",
            telefone="+5571990001122",
        )
        session.add(farmer)
        session.flush()

        msg = AgronomistMessageRecord(
            farmer_id=farmer.id,
            farmer_uuid=farmer.uuid,
            sender="agronomist",
            sender_name="Ana - Agrônoma",
            message_text="Bom dia, Dona Maria! O solo da Baixa do Riacho está com 35% de umidade.",
            is_read=False,
        )
        session.add(msg)

        # Adicionar item ao cache da NASA
        cache_item = NasaCacheRecord(
            cache_key="power_-12.97_-39.51_20260101_20261231",
            service="power",
            latitude=-12.97,
            longitude=-39.51,
            start_date="20260101",
            end_date="20261231",
            response_json={"type": "Feature", "properties": {"parameter": {"T2M": {"20260101": 28.07}}}},
            expires_at=datetime.now(timezone.utc),
        )
        session.add(cache_item)
        session.commit()

        # Consultar mensagem
        queried_msg = session.query(AgronomistMessageRecord).filter(
            AgronomistMessageRecord.farmer_uuid == farmer.uuid
        ).first()
        assert queried_msg is not None
        assert "Baixa do Riacho" in queried_msg.message_text
        assert queried_msg.sender == "agronomist"

        # Consultar cache
        queried_cache = session.query(NasaCacheRecord).filter(
            NasaCacheRecord.cache_key == "power_-12.97_-39.51_20260101_20261231"
        ).first()
        assert queried_cache is not None
        assert queried_cache.service == "power"
        assert queried_cache.response_json["properties"]["parameter"]["T2M"]["20260101"] == 28.07
    finally:
        session.close()
