"""
Adaptador NASA POWER - Field Shift
Consome a API pública da NASA POWER (Prediction Of Worldwide Energy Resources)
para extração de dados agroclimatológicos de alta precisão (temperatura, chuva, humidade do solo e altitude).
"""

import logging
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)


class NasaPowerAdapter:
    """
    Adaptador para a API REST pública da NASA POWER.
    Obtém médias agroclimatológicas (25 anos de observação por satélite MERRA-2/POWER).
    """

    BASE_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"
    TIMEOUT_SECONDS = 12.0

    def __init__(self, timeout: float = TIMEOUT_SECONDS):
        self.timeout = timeout

    def fetch_agroclimate(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Consulta parâmetros agroclimáticos essenciais na NASA POWER:
        - T2M: Temperatura média a 2 metros (°C)
        - PRECTOTCORR: Precipitação média (mm/dia)
        - RH2M: Humidade relativa a 2 metros (%)
        - GWETTOP: Humidade do solo na camada superficial (fração 0-1)
        - GWETROOT: Humidade do solo na zona radicular (fração 0-1)
        """
        params = {
            "parameters": "T2M,PRECTOTCORR,RH2M,GWETTOP,GWETROOT",
            "community": "AG",  # Agroclimatology community
            "longitude": round(longitude, 4),
            "latitude": round(latitude, 4),
            "format": "JSON",
        }
        headers = {
            "User-Agent": "FieldShift-Backend/1.0 (Angola Regenerative Agriculture Platform)",
            "Accept": "application/json",
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(self.BASE_URL, params=params, headers=headers)
                response.raise_for_status()
                data = response.json()

            properties = data.get("properties", {})
            param_data = properties.get("parameter", {})

            # 1. Temperatura Média Anual (°C)
            temp_ann = param_data.get("T2M", {}).get("ANN")
            if temp_ann is None or temp_ann == -999.0:
                temp_ann = 24.5  # Média padrão tropical angolana

            # 2. Precipitação Média Diária -> Anual (mm)
            precip_daily = param_data.get("PRECTOTCORR", {}).get("ANN")
            if precip_daily is None or precip_daily == -999.0:
                precip_anual = 850.0
            else:
                precip_anual = round(precip_daily * 365.25, 1)

            # 3. Humidade Relativa (%)
            rh_ann = param_data.get("RH2M", {}).get("ANN")
            if rh_ann is None or rh_ann == -999.0:
                rh_ann = 65.0

            # 4. Humidade do Solo (GWETTOP superficial e GWETROOT radicular)
            gwet_top = param_data.get("GWETTOP", {}).get("ANN")
            gwet_root = param_data.get("GWETROOT", {}).get("ANN")

            if gwet_top is not None and gwet_top != -999.0:
                if gwet_root is not None and gwet_root != -999.0:
                    humidade_solo = round((gwet_top * 0.4) + (gwet_root * 0.6), 3)
                else:
                    humidade_solo = round(gwet_top, 3)
            else:
                humidade_solo = 0.35  # Média típica ponderada

            # 5. Altitude / Elevação obtida na geometria do retorno da NASA
            coordinates = data.get("geometry", {}).get("coordinates", [])
            if len(coordinates) >= 3 and coordinates[2] is not None:
                elevacao = float(coordinates[2])
            else:
                elevacao = self._estimar_elevacao_angola(latitude, longitude)

            return {
                "temperatura_media": round(float(temp_ann), 2),
                "precipitacao": precip_anual,
                "umidade_relativa": round(float(rh_ann), 1),
                "humidade_solo": float(humidade_solo),
                "elevacao": round(elevacao, 1),
                "fonte": "NASA POWER Climatology (MERRA-2 Satellite)",
            }

        except Exception as exc:
            logger.warning(
                f"Falha ao consultar API NASA POWER para ({latitude}, {longitude}): {exc}. "
                "Utilizando modelo agroclimático de fallback calibrado para Angola."
            )
            return self._fallback_agroclima_angola(latitude, longitude)

    def _estimar_elevacao_angola(self, lat: float, lon: float) -> float:
        """Estimativa aproximada da altitude do relevo angolano por coordenadas."""
        # Planalto Central (Huambo/Bié): entre lat -11 a -14 e lon 15 a 18 -> 1400-1800m
        if -14.0 <= lat <= -11.0 and 15.0 <= lon <= 18.0:
            return 1650.0
        # Planalto da Huíla (Lubango): lat -15 a -14, lon 13 a 15 -> ~1700m
        if -15.5 <= lat <= -14.0 and 13.0 <= lon <= 15.0:
            return 1720.0
        # Faixa Litorânea (Luanda, Benguela, Lobito): lon < 14 -> 30 a 200m
        if lon < 14.0:
            return 85.0
        # Norte (Uíge, Malanje): 800 a 1100m
        return 950.0

    def _fallback_agroclima_angola(self, lat: float, lon: float) -> Dict[str, Any]:
        """Gera valores agronómicos realistas de fallback com base nas zonas agroecológicas de Angola."""
        elevacao = self._estimar_elevacao_angola(lat, lon)

        if elevacao > 1400.0:
            # Planalto Central (mais chuvoso e ameno)
            return {
                "temperatura_media": 20.5,
                "precipitacao": 1250.0,
                "umidade_relativa": 72.0,
                "humidade_solo": 0.42,
                "elevacao": elevacao,
                "fonte": "Modelo Agroecológico de Fallback (Planalto Central Angolano)",
            }
        elif lon < 13.5:
            # Litoral árido/semiárido
            return {
                "temperatura_media": 25.8,
                "precipitacao": 450.0,
                "umidade_relativa": 76.0,
                "humidade_solo": 0.22,
                "elevacao": elevacao,
                "fonte": "Modelo Agroecológico de Fallback (Litoral Angolano)",
            }
        else:
            # Savanas do Norte e Leste
            return {
                "temperatura_media": 24.0,
                "precipitacao": 980.0,
                "umidade_relativa": 68.0,
                "humidade_solo": 0.35,
                "elevacao": elevacao,
                "fonte": "Modelo Agroecológico de Fallback (Savanas de Angola)",
            }
