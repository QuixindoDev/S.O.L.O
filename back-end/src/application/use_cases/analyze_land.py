"""
Caso de Uso: Analisar Terra e Estimar Créditos de Carbono - Field Shift
Orquestra a identificação do Agricultor, busca de métricas espaciais, aplicação de regras agronómicas e cálculo de carbono.
"""

import uuid
import logging
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone

from src.domain.entities import (
    Fazenda,
    MetricasSatelite,
    DiagnosticoCompleto,
    Agricultor,
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
    1. Localiza ou cadastra o Agricultor responsável pela propriedade (vinculação obrigatória 1:N).
    2. Instancia e valida a entidade Fazenda (com UUID gerado ou fornecido para offline-first).
    3. Consulta o SatellitePort (NASA POWER / GEE) para extrair métricas biofísicas.
    4. Executa as regras de domínio para calcular o score de saúde do solo e risco de erosão.
    5. Consulta a matriz de rotação agroecológica para sugerir a melhor leguminosa regenerativa.
    6. Calcula a estimativa de créditos de carbono líquidos em tCO2e e o valor financeiro em USD.
    7. Persiste no repositório vinculando a análise ao agricultor correspondente.
    8. Retorna o DiagnosticoCompleto consolidado.
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
        farmer_uuid: Optional[str] = None,
        nome_fazenda: Optional[str] = None,
        localizacao_descricao: Optional[str] = None,
        poligono: Optional[List[Tuple[float, float]]] = None,
        margem_seguranca: float = 0.20,
        preco_carbono_usd: float = 20.0,
        analysis_uuid: Optional[str] = None,
        fazenda_uuid: Optional[str] = None,
    ) -> DiagnosticoCompleto:
        logger.info(
            f"Iniciando análise de terra para agricultor '{farmer_uuid or 'default'}', "
            f"coordenadas ({latitude}, {longitude}), área: {area_hectares} ha, cultura: '{cultura_atual}'"
        )

        # 1. Localiza ou cria o Agricultor (Farmer) responsável
        agricultor: Optional[Agricultor] = None
        if farmer_uuid and self.repository:
            agricultor = self.repository.find_farmer_by_uuid(farmer_uuid)
            if not agricultor:
                # Criar agricultor placeholder para clientes offline-first com UUID pré-gerado
                agricultor = Agricultor(
                    id=str(farmer_uuid).strip(),
                    nome_completo="Agricultor Familiar Local",
                    telefone="+244-900000000",
                    cooperativa="Cooperativa Regional",
                )
                try:
                    self.repository.save_farmer(agricultor)
                except Exception as e:
                    logger.warning(f"Não foi possível salvar agricultor preliminar: {e}")
        elif self.repository:
            agricultor = self.repository.find_or_create_default_farmer()
        else:
            agricultor = Agricultor(
                id=str(farmer_uuid or uuid.uuid4()),
                nome_completo="Agricultor Familiar de Angola",
                telefone="+244-923000000",
                cooperativa="Cooperativa Agroecológica de Angola",
            )

        # 2. Determina UUIDs da análise e da fazenda
        final_fazenda_uuid = str(fazenda_uuid).strip() if fazenda_uuid else str(uuid.uuid4())
        final_analysis_uuid = str(analysis_uuid).strip() if analysis_uuid else str(uuid.uuid4())

        # 3. Cria e valida a entidade do Domínio Fazenda
        fazenda = Fazenda(
            id=final_fazenda_uuid,
            nome=nome_fazenda or f"Talhão ({latitude:.3f}, {longitude:.3f})",
            latitude=latitude,
            longitude=longitude,
            area_hectares=area_hectares,
            cultura_atual=cultura_atual,
            localizacao_descricao=localizacao_descricao,
            poligono=poligono,
            farmer_uuid=agricultor.uuid if agricultor else None,
        )

        # 4. Requisita métricas espaciais via porta de satélite
        raw_metrics = self.satellite_port.fetch_metrics(latitude, longitude)

        metricas_satelite = MetricasSatelite(
            ndvi=float(raw_metrics.get("ndvi", 0.35)),
            humidade_solo=float(raw_metrics.get("humidade_solo", 0.30)),
            precipitacao=float(raw_metrics.get("precipitacao", 800.0)),
            elevacao=float(raw_metrics.get("elevacao", 1000.0)),
            temperatura_media=raw_metrics.get("temperatura_media"),
            umidade_relativa=raw_metrics.get("umidade_relativa"),
            fonte_dados=str(raw_metrics.get("fonte_dados", "Satélite / NASA POWER / GEE")),
            coletado_em=datetime.now(timezone.utc)
        )

        # 5. Executa as regras de domínio para saúde do solo
        analise_solo = calcular_score_saude_solo(metricas_satelite)

        # 6. Avalia a matriz de rotação regenerativa para o ecossistema angolano
        rotacao_principal, alternativas = obter_matriz_rotacao(
            cultura_atual=fazenda.cultura_atual,
            score_saude=analise_solo.score_saude,
            humidade_solo=analise_solo.humidade_solo
        )

        # 7. Calcula estimativa de créditos de carbono
        estimativa_carbono = calcular_estimativa_carbono(
            area_hectares=fazenda.area_hectares,
            taxa_sequestro_base=rotacao_principal.taxa_sequestro_adicional,
            score_saude=analise_solo.score_saude,
            margem_seguranca=margem_seguranca,
            preco_por_credito_usd=preco_carbono_usd
        )

        # 8. Consolida o diagnóstico com o UUID e agricultor vinculado
        diagnostico = DiagnosticoCompleto(
            id=final_analysis_uuid,
            fazenda=fazenda,
            metricas_satelite=metricas_satelite,
            analise_solo=analise_solo,
            rotacao_principal=rotacao_principal,
            alternativas_rotacao=alternativas,
            estimativa_carbono=estimativa_carbono,
            agricultor=agricultor,
            gerado_em=datetime.now(timezone.utc)
        )

        # 9. Persistência no repositório
        if self.repository:
            try:
                self.repository.save(diagnostico)
                logger.info(f"Diagnóstico com UUID {diagnostico.id} vinculado ao agricultor {agricultor.uuid if agricultor else 'N/A'} persistido com sucesso.")
            except Exception as exc:
                logger.error(f"Erro ao persistir diagnóstico {diagnostico.id}: {exc}")
                raise

        return diagnostico
