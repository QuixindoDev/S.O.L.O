"""
Portas de Repositório - Field Shift
Alias de compatibilidade arquitetural para src.application.ports.repository_port.
"""

from src.application.ports.repository_port import (
    FarmerRepositoryPort,
    LandAnalysisRepositoryPort,
)

__all__ = ["FarmerRepositoryPort", "LandAnalysisRepositoryPort"]
