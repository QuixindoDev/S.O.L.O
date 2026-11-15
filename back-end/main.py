"""
Ponto de Entrada Principal (FastAPI) - Field Shift Backend
Orquestra a inicialização de portas, adaptadores, persistência e rotas HTTP da arquitetura hexagonal.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.infrastructure.outbound.persistence.database import init_db
from src.infrastructure.outbound.persistence.postgres_repository import SQLAlchemyLandAnalysisRepository
from src.infrastructure.outbound.external.nasa_adapter import NasaPowerAdapter
from src.infrastructure.outbound.external.gee_adapter import GEEAdapter, MockGEEAdapter
from src.infrastructure.inbound.http.routers import router, set_dependencies

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("field_shift")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida da aplicação FastAPI: inicialização e liberação de recursos."""
    logger.info("Iniciando Field Shift Backend...")

    # 1. Inicializa o banco de dados (tabelas)
    init_db()
    logger.info("Banco de dados inicializado.")

    # 2. Configura adaptadores externos de acordo com o ambiente
    use_mock = os.getenv("USE_MOCK_SATELLITE", "false").lower() in ("true", "1", "yes")

    if use_mock:
        logger.info("Modo MOCK ativado: utilizando MockGEEAdapter.")
        satellite_port = MockGEEAdapter()
    else:
        logger.info("Utilizando GEEAdapter com integração à API NASA POWER.")
        nasa_adapter = NasaPowerAdapter()
        gee_project = os.getenv("EE_PROJECT_ID", None)
        satellite_port = GEEAdapter(nasa_adapter=nasa_adapter, project_id=gee_project)

    # 3. Repositório SQLAlchemy
    repository = SQLAlchemyLandAnalysisRepository()

    # 4. Injeta as dependências no roteador HTTP
    set_dependencies(satellite_port=satellite_port, repository=repository)
    logger.info("Injeção de dependências concluída com sucesso.")

    yield

    logger.info("Encerrando Field Shift Backend...")


app = FastAPI(
    title="Field Shift — API de Diagnóstico Agrícola e Créditos de Carbono",
    description="""
# 🌍 Field Shift Backend
Plataforma com **Arquitetura Hexagonal (Ports & Adapters)** que conecta pequenos agricultores
ao mercado voluntário de carbono através de dados de satélite gratuitos da **NASA POWER** e **Google Earth Engine**.

### 🌟 Funcionalidades Principais:
* **Diagnóstico de Saúde do Solo (0–100):** Cruzamento de NDVI, humidade volumétrica, precipitação e declive topográfico.
* **Matriz de Rotação Agronómica Regenerativa:** Prescrição automatizada de leguminosas fixadoras de nitrogénio (Feijão-frade, Amendoim/Ginguba, Guandu).
* **Quantificação de Créditos de Carbono:** Estimativa transparente em $tCO_2e$ e valorização em USD conforme metodologias internacionais (Verra / IPCC).
    """,
    version="1.0.0",
    lifespan=lifespan
)

# Habilitar CORS para permitir conexão direta de qualquer frontend (React, Vue, mobile)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rotas da API
app.include_router(router)


@app.get("/", tags=["Início"])
def root():
    return {
        "projeto": "Field Shift",
        "proposito": "Democratização do mercado voluntário de carbono para pequenos agricultores em Angola",
        "versao": "1.0.0",
        "documentacao_interativa": "/docs",
        "documentacao_redoc": "/redoc",
        "rotas_principais": {
            "registar_agricultor": "POST /api/v1/farmers",
            "listar_agricultores": "GET /api/v1/farmers",
            "analises_do_agricultor": "GET /api/v1/farmers/{farmer_uuid}/analyses",
            "analisar_terra": "POST /api/v1/analyze",
            "listar_analises": "GET /api/v1/analyses",
            "obter_analise": "GET /api/v1/analyses/{uuid}",
            "saude_sistema": "GET /health (e /api/v1/health)",
            "culturas_suportadas": "GET /api/v1/crops",
            "info_formula_carbono": "GET /api/v1/carbon-calculator-info"
        }
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
