"""
Rotas HTTP da API REST - Field Shift
Endpoints para gestão de Agricultores (Farmers), análise de terrenos agrícolas,
consulta de créditos de carbono e rotação de culturas regenerativas.
Utiliza estritamente UUIDs para identificação externa em conformidade com as regras de segurança e offline-first.
"""

from typing import List, Optional
import uuid as uuid_lib
from fastapi import APIRouter, HTTPException, Depends, Query, status

from src.domain.entities import Agricultor
from src.infrastructure.inbound.http.schemas import (
    FazendaCreateRequest,
    DiagnosticoResponse,
    HealthResponse,
    FarmerCreateRequest,
    FarmerResponse,
)
from src.application.use_cases.analyze_land import AnalyzeLandUseCase
from src.application.ports.satellite_port import SatellitePort
from src.application.ports.repository_port import LandAnalysisRepositoryPort

router = APIRouter(tags=["Field Shift - Diagnóstico Agrícola & Carbono"])

# Dependências a serem injetadas pela aplicação (main.py)
_satellite_port: Optional[SatellitePort] = None
_repository: Optional[LandAnalysisRepositoryPort] = None


def set_dependencies(satellite_port: SatellitePort, repository: LandAnalysisRepositoryPort):
    """Configura os adaptadores que sustentam os casos de uso das rotas."""
    global _satellite_port, _repository
    _satellite_port = satellite_port
    _repository = repository


def get_use_case() -> AnalyzeLandUseCase:
    """Provedor do caso de uso com injeção das portas."""
    if _satellite_port is None:
        raise RuntimeError("As portas de satélite não foram inicializadas.")
    return AnalyzeLandUseCase(
        satellite_port=_satellite_port,
        repository=_repository
    )


# ==============================================================================
# ENDPOINTS DE AGRICULTORES (FARMERS)
# ==============================================================================

@router.post(
    "/api/v1/farmers",
    response_model=FarmerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registar Novo Agricultor Familiar",
    description="Regista um agricultor com nome, telefone (pagamentos móveis) e cooperativa em Angola."
)
def create_farmer(request: FarmerCreateRequest):
    if not _repository:
        raise HTTPException(status_code=503, detail="Repositório não configurado.")
    try:
        target_uuid = request.uuid or str(uuid_lib.uuid4())
        agricultor = Agricultor(
            id=target_uuid,
            nome_completo=request.nome_completo,
            telefone=request.telefone,
            cooperativa=request.cooperativa,
            bilhete_identidade_ou_codigo=request.bilhete_identidade_ou_codigo,
        )
        _repository.save_farmer(agricultor)
        return agricultor.to_dict()
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar agricultor: {str(exc)}")


@router.get(
    "/api/v1/farmers",
    response_model=List[FarmerResponse],
    summary="Listar Agricultores Registados",
    description="Lista todos os agricultores familiares cadastrados na plataforma com paginação."
)
def list_farmers(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    if not _repository:
        raise HTTPException(status_code=503, detail="Repositório não configurado.")
    try:
        farmers = _repository.list_farmers(limit=limit, offset=offset)
        return [f.to_dict() for f in farmers]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao listar agricultores: {str(exc)}")


@router.get(
    "/api/v1/farmers/{farmer_uuid}",
    response_model=FarmerResponse,
    summary="Obter Agricultor por UUID",
    description="Recupera os detalhes de um agricultor específico pelo seu UUID público."
)
def get_farmer_by_uuid(farmer_uuid: str):
    if not _repository:
        raise HTTPException(status_code=503, detail="Repositório não configurado.")
    farmer = _repository.find_farmer_by_uuid(farmer_uuid)
    if not farmer:
        raise HTTPException(status_code=404, detail=f"Agricultor com UUID '{farmer_uuid}' não encontrado.")
    return farmer.to_dict()


@router.get(
    "/api/v1/farmers/{farmer_uuid}/analyses",
    response_model=List[DiagnosticoResponse],
    summary="Listar Análises de Terra de um Agricultor",
    description="Retorna todas as análises de solo e estimativas de carbono associadas a um agricultor específico (relação 1:N)."
)
def get_farmer_analyses(
    farmer_uuid: str,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    if not _repository:
        raise HTTPException(status_code=503, detail="Repositório não configurado.")

    # 1. Verificar se o agricultor existe
    farmer = _repository.find_farmer_by_uuid(farmer_uuid)
    if not farmer:
        raise HTTPException(status_code=404, detail=f"Agricultor com UUID '{farmer_uuid}' não encontrado.")

    # 2. Listar as análises vinculadas a esse agricultor
    try:
        analyses = _repository.find_by_farmer_uuid(farmer_uuid=farmer_uuid, limit=limit, offset=offset)
        return [a.to_dict() for a in analyses]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar análises do agricultor: {str(exc)}")


# ==============================================================================
# ENDPOINTS DE ANÁLISE DE TERRAS E CARBONO
# ==============================================================================

@router.post(
    "/api/v1/analyze",
    response_model=DiagnosticoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Analisar Terra e Calcular Créditos de Carbono",
    description=(
        "Cruza as coordenadas geográficas da propriedade com dados de satélite da NASA POWER e Google Earth Engine. "
        "Diagnostica a saúde do solo (0-100), define o risco de erosão, prescreve rotação de culturas regenerativas "
        "e quantifica os créditos de carbono voluntários (tCO2e e USD). "
        "Permite associar obrigatoriamente a terra ao agricultor através de farmer_uuid."
    )
)
def analyze_land(
    request: FazendaCreateRequest,
    use_case: AnalyzeLandUseCase = Depends(get_use_case)
):
    try:
        diagnostico = use_case.execute(
            latitude=request.latitude,
            longitude=request.longitude,
            area_hectares=request.area_hectares,
            cultura_atual=request.cultura_atual,
            farmer_uuid=request.farmer_uuid,
            nome_fazenda=request.nome,
            localizacao_descricao=request.localizacao_descricao,
            margem_seguranca=request.margem_seguranca or 0.20,
            preco_carbono_usd=request.preco_carbono_usd or 20.0,
            analysis_uuid=request.uuid,
            fazenda_uuid=request.fazenda_uuid,
        )
        return diagnostico.to_dict()
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao processar análise biofísica do terreno: {str(exc)}"
        )


@router.get(
    "/api/v1/analyses",
    response_model=List[DiagnosticoResponse],
    summary="Listar Histórico Geral de Análises de Terras",
    description="Retorna a lista de diagnósticos agroecológicos realizados anteriormente na plataforma usando UUIDs."
)
def list_analyses(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    if not _repository:
        raise HTTPException(status_code=503, detail="Repositório não configurado.")
    try:
        results = _repository.list_recent(limit=limit, offset=offset)
        return [r.to_dict() for r in results]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao listar análises: {str(exc)}")


@router.get(
    "/api/v1/analyses/{uuid}",
    response_model=DiagnosticoResponse,
    summary="Obter Diagnóstico por UUID",
    description="Recupera o diagnóstico completo e estimativa de carbono de uma análise específica através do seu UUID."
)
def get_analysis_by_uuid(uuid: str):
    if not _repository:
        raise HTTPException(status_code=503, detail="Repositório não configurado.")
    analysis = _repository.find_by_uuid(uuid)
    if not analysis:
        # Fallback para find_by_id caso seja consultado por id
        analysis = _repository.find_by_id(uuid)
    if not analysis:
        raise HTTPException(status_code=404, detail=f"Diagnóstico com UUID '{uuid}' não encontrado.")
    return analysis.to_dict()


# ==============================================================================
# ENDPOINTS DE SAÚDE E METADADOS
# ==============================================================================

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Verificação de Saúde do Sistema",
    description="Verifica o status operacional da API, adaptadores de satélite (NASA, GEE) e banco de dados."
)
@router.get(
    "/api/v1/health",
    response_model=HealthResponse,
    summary="Verificação de Saúde do Sistema (v1)",
    include_in_schema=False
)
def health_check():
    from src.infrastructure.outbound.external.gee_adapter import GEEAdapter, MockGEEAdapter
    is_gee_auth = False
    adapter_name = "Desconhecido"

    if isinstance(_satellite_port, GEEAdapter):
        is_gee_auth = _satellite_port.is_authenticated
        adapter_name = "GEEAdapter (NASA POWER + GEE Sentinel/SRTM)"
    elif isinstance(_satellite_port, MockGEEAdapter):
        adapter_name = "MockGEEAdapter (Simulação Rápida para Desenvolvimento)"
    elif _satellite_port is not None:
        adapter_name = _satellite_port.__class__.__name__

    return HealthResponse(
        status="operacional",
        servico="Field Shift Backend",
        versao="1.1.0",
        satelite_adapter=adapter_name,
        gee_autenticado=is_gee_auth,
        banco_dados="SQLAlchemy (PostgreSQL / SQLite ativo com suporte a Farmers)"
    )


@router.get(
    "/api/v1/crops",
    summary="Culturas e Dinâmicas de Rotação Suportadas",
    description="Retorna o catálogo de culturas da agricultura familiar angolana e suas propriedades regenerativas."
)
def get_supported_crops():
    return {
        "culturas_base": [
            {"nome": "Milho", "caracteristica": "Depletora de Nitrogénio", "risco_monocultura": "Alto"},
            {"nome": "Mandioca", "caracteristica": "Extratora de Potássio e Exposição do Solo", "risco_monocultura": "Médio-Alto"},
            {"nome": "Massango", "caracteristica": "Resistente à Seca (Semiárido)", "risco_monocultura": "Médio"},
            {"nome": "Massambala", "caracteristica": "Cereal de Sequeiro", "risco_monocultura": "Médio"},
            {"nome": "Algodão", "caracteristica": "Comercial / Compactação e Nematoides", "risco_monocultura": "Alto"}
        ],
        "leguminosas_regenerativas": [
            {
                "nome": "Feijão-frade",
                "nome_cientifico": "Vigna unguiculata",
                "funcao": "Fixação biológica de Nitrogénio e ciclo curto",
                "taxa_sequestro_media": "1.25 t C/ha/ano"
            },
            {
                "nome": "Amendoim (Ginguba)",
                "nome_cientifico": "Arachis hypogaea",
                "funcao": "Fixação de N2 e alto valor de comercialização local",
                "taxa_sequestro_media": "1.10 t C/ha/ano"
            },
            {
                "nome": "Feijão-guandu",
                "nome_cientifico": "Cajanus cajan",
                "funcao": "Descompactação de subsolo e quebra-vento",
                "taxa_sequestro_media": "1.45 t C/ha/ano"
            },
            {
                "nome": "Mucuna-preta",
                "nome_cientifico": "Mucuna pruriens",
                "funcao": "Alta biomassa, supressão de invasoras e controle de nematoides",
                "taxa_sequestro_media": "1.35 t C/ha/ano"
            }
        ]
    }


@router.get(
    "/api/v1/carbon-calculator-info",
    summary="Metodologia e Fórmula de Carbono",
    description="Detalhes da fórmula matemática aplicada para estimativa de créditos de carbono voluntários."
)
def get_carbon_formula_info():
    return {
        "formula": "Créditos líquidos (tCO2e) = (Hectares × Taxa de Sequestro × 3.67) × (1 - Margem de Segurança)",
        "parametros": {
            "Hectares": "Área da propriedade agrícola sob manejo regenerativo",
            "Taxa de Sequestro": "Acúmulo de carbono orgânico no solo (t C / ha / ano) proporcionado pela rotação recomendada",
            "Fator 3.67": "Razão estequiométrica entre o peso molecular do CO2 (44) e do Carbono elementar (12): 44 / 12 = 3.667",
            "Margem de Segurança (Buffer)": "Normalmente 20% (0.20) retido em pool de reserva contra reversão ou incerteza amostral (conformidade Verra VM0042 / Gold Standard)",
            "Preço por Crédito": "Cotação voluntária em USD (média de mercado: $20.00 / tCO2e)"
        },
        "exemplo_calculo": {
            "cenario": "Fazenda de 10 hectares em Huambo com rotação de Milho para Feijão-frade",
            "taxa_sequestro": "1.25 t C/ha/ano",
            "co2_bruto": "10 × 1.25 × 3.67 = 45.88 tCO2e",
            "creditos_liquidos": "45.88 × (1 - 0.20) = 36.70 tCO2e/ano",
            "valor_anual_usd": "36.70 × $20.00 = $734.00 USD/ano"
        }
    }
