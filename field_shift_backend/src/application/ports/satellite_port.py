"""
Porta de Acesso a Dados de Satélite - Field Shift
Define o contrato de interface (Port) que isola a aplicação das APIs espaciais externas.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any


class SatellitePort(ABC):
    """
    Contrato que dita como o sistema requisita métricas biofísicas e climáticas de satélite,
    independentemente de estarem a vir do Google Earth Engine, NASA POWER, Sentinel ou Mock.
    """

    @abstractmethod
    def fetch_metrics(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Coleta dados espaciais e biofísicos para as coordenadas indicadas.

        Deve retornar obrigatoriamente um dicionário contendo:
        - 'ndvi': float (Índice de Vegetação por Diferença Normalizada)
        - 'humidade_solo': float (Fração de humidade volumétrica superficial 0.0 - 1.0)
        - 'precipitacao': float (Precipitação média diária ou anual em mm)
        - 'elevacao': float (Altitude em metros acima do nível do mar)

        Campos opcionais adicionais:
        - 'temperatura_media': float (°C)
        - 'umidade_relativa': float (%)
        - 'fonte_dados': str
        """
        pass
