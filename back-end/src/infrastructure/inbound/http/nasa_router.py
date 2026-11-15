"""
Rotas HTTP dosatasets NASA - Field Shift / S.O.L.O. Campo Amigo
Implementa o contrato definido em `API-CONTRATO.md`:

  - GET /api/nasa/power  -> série diária NASA POWER (temperatura, chuva, humidade, radiação)
  - GET /api/nasa/smap   -> humidade do solo (GWETTOP / GWETROOT do NASA POWER)

Objectivos:
  1. Proteger o front-end de CORS, limites de taxa e quedas da NASA.
  2. Cachear por coordenada (TTL de 24h) — o histórico não muda todos os dias.
  3. Normalizar o formato (datas AAAAMMDD, unidades em °C, mm, MJ/m²).
"""

import logging
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

import httpx
from fastapi import APIRouter, HTTPException, Query, status

logger = logging.getLogger(__name__)

nasa_router = APIRouter(prefix="/api/nasa", tags=["Datasets NASA (POWER, SMAP)"])

# URL pública da NASA POWER (sem API key).
POWER_DAILY_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

# Parâmetros agroclimatológicos consumidos pelo front-end.
POWER_PARAMETERS = "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN,WS2M"
# Parâmetros de humidade do solo (superficial / zona radicular).
SOIL_PARAMETERS = "GWETTOP,GWETROOT"

REQUEST_TIMEOUT_SECONDS = float(os.getenv("NASA_TIMEOUT_SECONDS", "20"))
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", str(24 * 60 * 60)))

# Cache em memória: (chave) -> (timestamp de gravação, payload)
_cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}


def _normalize_date(value: Optional[str], default: str) -> str:
    """Aceita 'AAAA-MM-DD' ou 'AAAAMMDD' e devolve sempre 'AAAAMMDD'."""
    if not value:
        return default

    clean = value.strip()
    if "-" in clean:
        clean = clean.replace("-", "")

    if len(clean) != 8 or not clean.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Data inválida '{value}'. Use o formato AAAA-MM-DD ou AAAAMMDD.",
        )
    return clean


def _cache_get(key: str) -> Optional[Dict[str, Any]]:
    entry = _cache.get(key)
    if not entry:
        return None

    stored_at, payload = entry
    if time.time() - stored_at > CACHE_TTL_SECONDS:
        _cache.pop(key, None)
        return None
    return payload


def _cache_set(key: str, payload: Dict[str, Any]) -> None:
    _cache[key] = (time.time(), payload)
    # Limpa entradas vencidas para não crescer sem limite.
    now = time.time()
    for stale in [k for k, (ts, _) in _cache.items() if now - ts > CACHE_TTL_SECONDS]:
        _cache.pop(stale, None)


def _fetch_power(
    latitude: float,
    longitude: float,
    start: str,
    end: str,
    parameters: str = POWER_PARAMETERS,
) -> Dict[str, Any]:
    """Chama a NASA POWER e devolve o payload cru (com cache de 24h)."""
    params = {
        "parameters": parameters,
        "community": "AG",
        "longitude": round(longitude, 4),
        "latitude": round(latitude, 4),
        "start": start,
        "end": end,
        "format": "JSON",
    }
    headers = {
        "User-Agent": "FieldShift-Backend/1.0 (S.O.L.O. Campo Amigo)",
        "Accept": "application/json",
    }

    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = client.get(POWER_DAILY_URL, params=params, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as exc:
        logger.error("NASA POWER respondeu %s: %s", exc.response.status_code, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="A NASA POWER está indisponível neste momento. Tente novamente dentro de pouco tempo.",
        )
    except Exception as exc:
        logger.error("Falha ao consultar a NASA POWER: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Não foi possível contactar a NASA POWER neste momento.",
        )


def _with_metadata(
    payload: Dict[str, Any],
    latitude: float,
    longitude: float,
    source: str,
) -> Dict[str, Any]:
    """Acrescenta a proveniência do dado (contrato NFR-06)."""
    enriched = dict(payload)
    enriched["lat"] = latitude
    enriched["lon"] = longitude
    enriched["source"] = source
    enriched["generatedAt"] = datetime.now(timezone.utc).isoformat()
    return enriched


@nasa_router.get(
    "/power",
    summary="Série Diária NASA POWER (Agroclimatology)",
    description=(
        "Devolve a série diária normalizada da NASA POWER para as coordenadas indicadas: "
        "temperatura (T2M, T2M_MAX, T2M_MIN), precipitação (PRECTOTCORR), humidade relativa (RH2M), "
        "radiação solar (ALLSKY_SFC_SW_DWN) e vento (WS2M). "
        "O histórico é cacheado durante 24 horas."
    ),
)
def get_power_series(
    lat: float = Query(default=-12.776, ge=-90.0, le=90.0, description="Latitude decimal"),
    lon: float = Query(default=15.739, ge=-180.0, le=180.0, description="Longitude decimal"),
    start: Optional[str] = Query(default=None, description="Início (AAAA-MM-DD ou AAAAMMDD)"),
    end: Optional[str] = Query(default=None, description="Fim (AAAA-MM-DD ou AAAAMMDD)"),
):
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    start_date = _normalize_date(start, today)
    end_date = _normalize_date(end, today)

    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A data de início não pode ser posterior à data de fim.",
        )

    cache_key = f"power:{lat:.4f}:{lon:.4f}:{start_date}:{end_date}:{POWER_PARAMETERS}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return _with_metadata(cached, lat, lon, "NASA POWER (cached 24h)")

    payload = _fetch_power(lat, lon, start_date, end_date)
    _cache_set(cache_key, payload)
    return _with_metadata(payload, lat, lon, "NASA POWER")


@nasa_router.get(
    "/smap",
    summary="Humidade do Solo (NASA POWER GWET)",
    description=(
        "Humidade do solo na camada superficial (GWETTOP) e na zona radicular (GWETROOT), "
        "em fração volumétrica (0–1). Derivado do mesmo modelo MERRA-2 do NASA POWER, "
        "com cache de 24 horas."
    ),
)
def get_soil_moisture(
    lat: float = Query(default=-12.776, ge=-90.0, le=90.0),
    lon: float = Query(default=15.739, ge=-180.0, le=180.0),
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
):
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    start_date = _normalize_date(start, today)
    end_date = _normalize_date(end, today)

    cache_key = f"smap:{lat:.4f}:{lon:.4f}:{start_date}:{end_date}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return _with_metadata(cached, lat, lon, "NASA POWER GWET (cached 24h)")

    payload = _fetch_power(lat, lon, start_date, end_date, SOIL_PARAMETERS)
    _cache_set(cache_key, payload)
    return _with_metadata(
        payload, lat, lon, "NASA POWER (GWETTOP / GWETROOT)"
    )


@nasa_router.get(
    "/ecostress",
    summary="Estresse Térmico (ECOSTRESS)",
    description=(
        "Ainda não configurado: exige credenciais NASA Earthdata (token Bearer) para o "
        "ECOSTRESS L2/L3. Enquanto as credenciais não existirem, use /api/nasa/power."
    ),
)
def get_ecostress():
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="ECOSTRESS requer credenciais NASA Earthdata (ECOSTRESS_TOKEN) ainda não configuradas.",
    )


@nasa_router.get(
    "/gpm",
    summary="Precipitação IMERG (GPM)",
    description=(
        "Ainda não configurado: o IMERG exige credenciais NASA Earthdata (Bearer token) "
        "e acesso ao serviço GES DISC."
    ),
)
def get_gpm():
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="GPM IMERG requer credenciais NASA Earthdata (EARTHDATA_TOKEN) ainda não configuradas.",
    )
