"""
Testes de Integração dos Adaptadores Externos - Field Shift
"""

import pytest
from src.infrastructure.outbound.external.nasa_adapter import NasaPowerAdapter
from src.infrastructure.outbound.external.gee_adapter import GEEAdapter, MockGEEAdapter


def test_mock_gee_adapter():
    adapter = MockGEEAdapter(default_ndvi=0.45, default_humidade=0.25)
    metrics = adapter.fetch_metrics(-12.0, 15.0)

    assert "ndvi" in metrics
    assert "humidade_solo" in metrics
    assert "precipitacao" in metrics
    assert "elevacao" in metrics
    assert metrics["ndvi"] == 0.45
    assert metrics["humidade_solo"] == 0.25


def test_nasa_power_adapter_live_or_fallback():
    """Testa o adaptador da NASA POWER para coordenadas de Luanda / Huambo."""
    adapter = NasaPowerAdapter()
    # Huambo, Angola: lat -12.77, lon 15.73
    data = adapter.fetch_agroclimate(latitude=-12.77, longitude=15.73)

    assert "temperatura_media" in data
    assert "precipitacao" in data
    assert "humidade_solo" in data
    assert "elevacao" in data
    assert data["elevacao"] > 0
    assert 0.0 <= data["humidade_solo"] <= 1.0


def test_gee_adapter_with_nasa_integration():
    """Valida o GEEAdapter operando com a NASA POWER integrada."""
    adapter = GEEAdapter()
    metrics = adapter.fetch_metrics(-12.77, 15.73)

    assert "ndvi" in metrics
    assert "humidade_solo" in metrics
    assert "precipitacao" in metrics
    assert "elevacao" in metrics
    assert -1.0 <= metrics["ndvi"] <= 1.0
