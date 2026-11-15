"""
Caso de Uso: Desativação Lógica de Agricultor (Soft Delete) - Field Shift
Desativa logicamente o agricultor alterando is_active para False, garantindo que
o histórico de análises de satélite, dados de solo e créditos de carbono nunca seja perdido.
"""

import logging
from src.application.ports.repository_port import FarmerRepositoryPort
from src.domain.entities import Agricultor

logger = logging.getLogger(__name__)


class DeactivateFarmerUseCase:
    """
    Caso de Uso: Desativação Lógica de Agricultor (Soft Delete).
    Localiza o agricultor pelo UUID, altera o estado is_active para False
    e persiste a alteração, garantindo conformidade com auditoria internacional.
    """

    def __init__(self, repository: FarmerRepositoryPort):
        self.repository = repository

    def execute(self, farmer_uuid: str) -> Agricultor:
        clean_uuid = str(farmer_uuid).strip()
        logger.info(f"Iniciando desativação lógica (soft delete) do agricultor: {clean_uuid}")

        agricultor = self.repository.find_farmer_by_uuid(clean_uuid)
        if not agricultor:
            logger.warning(f"Agricultor com UUID '{clean_uuid}' não encontrado para desativação.")
            raise ValueError(f"Agricultor com UUID '{clean_uuid}' não encontrado.")

        # Altera o campo is_active para False através do método de domínio
        agricultor.deactivate()

        # Guarda as alterações no repositório
        self.repository.save_farmer(agricultor)

        logger.info(f"Agricultor '{clean_uuid}' desativado com sucesso. Histórico de carbono preservado.")
        return agricultor
