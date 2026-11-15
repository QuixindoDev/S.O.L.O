"""
Portas de Repositório - Field Shift
Define os contratos de persistência para Agricultores e Diagnósticos de Terras.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from src.domain.entities import DiagnosticoCompleto, Agricultor


class FarmerRepositoryPort(ABC):
    """Contrato abstrato para persistência e gestão de agricultores."""

    @abstractmethod
    def save_farmer(self, agricultor: Agricultor) -> str:
        """Salva um agricultor e retorna o seu UUID."""
        pass

    @abstractmethod
    def find_farmer_by_uuid(self, farmer_uuid: str) -> Optional[Agricultor]:
        """Recupera um agricultor pelo seu UUID público."""
        pass

    @abstractmethod
    def list_farmers(self, limit: int = 50, offset: int = 0) -> List[Agricultor]:
        """Lista os agricultores cadastrados com suporte a paginação."""
        pass

    @abstractmethod
    def find_or_create_default_farmer(self) -> Agricultor:
        """Obtém um agricultor padrão ou cria um novo caso nenhum exista."""
        pass


class LandAnalysisRepositoryPort(FarmerRepositoryPort):
    """
    Contrato abstrato para persistência de dados de análise de terras.
    Herda métodos de FarmerRepositoryPort para permitir gestão unificada ou composta.
    """

    @abstractmethod
    def save(self, diagnostico: DiagnosticoCompleto) -> str:
        """
        Salva um diagnóstico completo associado ao agricultor e retorna o seu UUID.
        """
        pass

    @abstractmethod
    def find_by_uuid(self, analysis_uuid: str) -> Optional[DiagnosticoCompleto]:
        """
        Recupera um diagnóstico pelo seu UUID único exposto ao exterior.
        """
        pass

    @abstractmethod
    def find_by_id(self, analysis_id: str) -> Optional[DiagnosticoCompleto]:
        """
        Recupera um diagnóstico pelo identificador (UUID ou ID interno).
        """
        pass

    @abstractmethod
    def list_recent(self, limit: int = 50, offset: int = 0) -> List[DiagnosticoCompleto]:
        """
        Lista as análises mais recentes paginadas baseadas em UUIDs.
        """
        pass

    @abstractmethod
    def find_by_farmer_uuid(self, farmer_uuid: str, limit: int = 50, offset: int = 0) -> List[DiagnosticoCompleto]:
        """
        Lista todas as terras/análises associadas a um agricultor específico.
        """
        pass
