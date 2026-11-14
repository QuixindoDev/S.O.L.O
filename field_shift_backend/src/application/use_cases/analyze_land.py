"""
Caso de Uso: Analisar Terra e Estimar Créditos de Carbono - Field Shift
Orquestra a busca de métricas espaciais, aplicação de regras agronómicas e cálculo de carbono.
"""

import uuid
import logging
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone

from src.domain.entities import (
    Fazenda,
    MetricasSatelite,
    DiagnosticoCompleto,
)
from src.domain.rules import (
    calcular_score_saude_solo,
    obter_matriz_rotacao,
    calcular_estimativa_carbono,
)
from src.application.ports.satellite_port import SatellitePort
from src.application.ports.repository_port import LandAnalysisRepositoryPort

logger = logging.getLogger(__name__)


class AnalyzeLandUseCase:
    """
    Caso de Uso Principal do Field Shift:
    1. Instancia e valida a entidade Fazenda.
    2. Consulta o SatellitePort (NASA POWER / GEE) para extrair os dados biofísicos.
    3. Executa as regras de domínio para calcular o score de saúde do solo e risco de erosão.
    4. Consulta a matriz de rotação agroecológica para sugerir a melhor cultura regenerativa (ex: Milho -> Feijão-frade).
    5. Calcula a estimativa de créditos de carbono líquidos em tCO2e e o valor financeiro comercializável em USD.
    6. Persiste opcionalmente no repositório.
    7. Retorna o DiagnosticoCompleto consolidado.
    """

    def __init__(
        self,
        satellite_port: SatellitePort,
        repository: Optional[LandAnalysisRepositoryPort] = None
    ):
        self.satellite_port = satellite_port
        self.repository = repository

    def execute(
        self,
        latitude: float,
        longitude: float,
        area_hectares: float,
        cultura_atual: str,
        nome_fazenda: Optional[str] = None,
        localizacao_descricao: Optional[str] = None,
        poligono: Optional[List[Tuple[float, float]]] = None,
        margem_seguranca: float = 0.20,
        preco_carbono_usd: float = 20.0
    ) -> DiagnosticoCompleto:
        logger.info(
            f"Iniciando análise de terra para coordenadas ({latitude}, {longitude}), "
            f"área: {area_hectares} ha, cultura: '{cultura_atual}'"
        )

        # 1. Cria e valida a entidade do Domínio
        fazenda = Fazenda(
            id=str(uuid.uuid4()),
            nome=nome_fazenda or f"Talhão ({latitude:.3f}, {longitude:.3f})",
            latitude=latitude,
            longitude=longitude,
            area_hectares=area_hectares,
            cultura_atual=cultura_atual,
            localizacao_descricao=localizacao_descricao,
            poligono=poligono
        )

        # 2. Requisita métricas via porta de satélite
        raw_metrics = self.satellite_port.fetch_metrics(latitude, longitude)

        metricas_satelite = MetricasSatelite(
            ndvi=float(raw_metrics.get("ndvi", 0.35)),
            humidade_solo=float(raw_metrics.get("humidade_solo", 0.30)),
            precipitacao=float(raw_metrics.get("precipitacao", 800.0)),
            elevacao=float(raw_metrics.get("elevacao", 1000.0)),
            temperatura_media=raw_metrics.get("temperatura_media"),
            umidade_relativa=raw_metrics.get("umidade_relativa"),
            fonte_dados=str(raw_metrics.get("fonte_dados", "Satélite / Climatologia")),
            coletado_em=datetime.now(timezone.utc)
        )

        # 3. Executa as regras de domínio para saúde do solo
        analise_solo = calcular_score_saude_solo(metricas_satelite)

        # 4. Avalia a matriz de rotação regenerativa
        rotacao_principal, alternativas = obter_matriz_rotacao(
            cultura_atual=fazenda.cultura_atual,
            score_saude=analise_solo.score_saude,
            humidade_solo=analise_solo.humidade_solo
        )

        # 5. Calcula créditos de carbono com a taxa da cultura regenerativa recomendada
        estimativa_carbono = calcular_estimativa_carbono(
            area_hectares=fazenda.area_hectares,
            taxa_sequestro_base=rotacao_principal.taxa_sequestro_adicional,
            score_saude=analise_solo.score_saude,
            margem_seguranca=margem_seguranca,
            preco_por_credito_usd=preco_carbono_usd
        )

        # 6. Consolida o diagnóstico
        diagnostico = DiagnosticoCompleto(
            id=str(uuid.uuid4()),
            fazenda=fazenda,
            metricas_satelite=metricas_satelite,
            analise_solo=analise_solo,
            rotacao_principal=rotacao_principal,
            alternativas_rotacao=alternativas,
            estimativa_carbono=estimativa_carbono,
            gerado_em=datetime.now(timezone.utc)
        )

        # 7. Persistência opcional se o repositório estiver configurado
        if self.repository:
            try:
                self.repository.save(diagnostico)
                logger.info(f"Diagnóstico {diagnostico.id} persistido com sucesso.")
            except Exception as exc:
                logger.error(f"Erro ao persistir diagnóstico {diagnostico.id}: {exc}")

        return diagnostico
