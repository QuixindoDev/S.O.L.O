"""
Porta de Repositório de Diagnósticos - Field Shift
Define o contrato de persistência para armazenar e consultar análises históricas.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from src.domain.entities import DiagnosticoCompleto


class LandAnalysisRepositoryPort(ABC):
    """Contrato abstrato para persistência de dados de análise de terras."""

    @abstractmethod
    def save(self, diagnostico: DiagnosticoCompleto) -> str:
        """Salva um diagnóstico completo e retorna o seu identificador único."""
        pass

    @abstractmethod
    def find_by_id(self, analysis_id: str) -> Optional[DiagnosticoCompleto]:
        """Recupera um diagnóstico pelo ID."""
        pass

    @abstractmethod
    def list_recent(self, limit: int = 50, offset: int = 0) -> List[DiagnosticoCompleto]:
        """Lista as análises mais recentes paginadas."""
        pass
