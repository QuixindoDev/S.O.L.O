"""
Testes Unitários de Regras de Domínio - Field Shift
Validação das fórmulas de saúde do solo, matriz de rotação e cálculo de carbono.
"""

import pytest
from src.domain.entities import MetricasSatelite
from src.domain.rules import (
    calcular_score_saude_solo,
    calcular_risco_erosao,
    obter_matriz_rotacao,
    calcular_estimativa_carbono,
)


def test_matriz_rotacao_milho_score_baixo():
    """
    Especificação explícita:
    Se cultura atual == 'Milho' e score < 50 -> Sugerir 'Feijão-frade' ou 'Amendoim'
    (justificativa: fixação biológica de nitrogénio).
    """
    principal, alternativas = obter_matriz_rotacao(
        cultura_atual="Milho",
        score_saude=42.0,
        humidade_solo=0.25
    )

    assert principal.cultura_recomendada == "Feijão-frade"
    assert "nitrogénio" in principal.justificativa.lower() or "nitrogênio" in principal.justificativa.lower()
    assert len(alternativas) >= 1
    assert "Amendoim" in alternativas[0].cultura_recomendada


def test_matriz_rotacao_milho_score_alto():
    """Para milho em solos já saudáveis (score >= 50)."""
    principal, alternativas = obter_matriz_rotacao(
        cultura_atual="Milho",
        score_saude=75.0,
        humidade_solo=0.40
    )

    assert "Feijão-de-porco" in principal.cultura_recomendada or "Soja" in principal.cultura_recomendada
    assert principal.taxa_sequestro_adicional > 1.0


def test_matriz_rotacao_mandioca():
    """Para culturas de Mandioca."""
    principal, alternativas = obter_matriz_rotacao(
        cultura_atual="Mandioca",
        score_saude=35.0,
        humidade_solo=0.20
    )

    assert "Mucuna" in principal.cultura_recomendada or "Feijão" in principal.cultura_recomendada
    assert len(alternativas) >= 1


def test_matriz_rotacao_massango():
    """Para culturas do semiárido angolano (Massango/Sorgo)."""
    principal, _ = obter_matriz_rotacao(
        cultura_atual="Massango",
        score_saude=40.0,
        humidade_solo=0.15
    )

    assert "guandu" in principal.cultura_recomendada.lower()


def test_formula_carbono():
    """
    Fórmula: Créditos líquidos = (Hectares × Taxa de Sequestro × 3.67) × (1 - Margem de Segurança)
    Exemplo: 10 ha, taxa = 1.0, margem = 0.20 (20%)
    CO2 bruto = 10 * 1.0 * 3.67 = 36.70
    Líquido = 36.70 * 0.80 = 29.36 tCO2e
    """
    est = calcular_estimativa_carbono(
        area_hectares=10.0,
        taxa_sequestro_base=1.0,
        score_saude=55.0,  # Fator adicionalidade 1.0
        margem_seguranca=0.20,
        preco_por_credito_usd=20.0
    )

    assert est.area_hectares == 10.0
    assert est.fator_conversao_co2 == 3.67
    assert est.margem_seguranca == 0.20
    assert est.emissao_bruta_tco2e == 36.70
    assert est.creditos_liquidos_tco2e == 29.36
    assert est.valor_estimado_usd == round(29.36 * 20.0, 2)


def test_score_saude_solo():
    """Verifica se o score se mantém estritamente no intervalo [0, 100]."""
    metricas_boas = MetricasSatelite(
        ndvi=0.68,
        humidade_solo=0.38,
        precipitacao=1100.0,
        elevacao=1200.0
    )
    analise = calcular_score_saude_solo(metricas_boas)

    assert 0.0 <= analise.score_saude <= 100.0
    assert analise.score_saude >= 65.0
    assert analise.classificacao_saude in ("Bom", "Excelente")

    metricas_degradadas = MetricasSatelite(
        ndvi=0.12,
        humidade_solo=0.10,
        precipitacao=300.0,
        elevacao=1800.0
    )
    analise_deg = calcular_score_saude_solo(metricas_degradadas)
    assert 0.0 <= analise_deg.score_saude <= 100.0
    assert analise_deg.score_saude < 50.0
    assert analise_deg.classificacao_saude in ("Degradado", "Crítico")


def test_risco_erosao():
    """Terreno descoberto com alta elevação e chuva deve acusar risco alto."""
    risco_alto = calcular_risco_erosao(
        ndvi=0.10,
        elevacao=1900.0,
        precipitacao_anual=1300.0,
        humidade_solo=0.12
    )
    assert risco_alto in ("Alto", "Muito Alto")

    risco_baixo = calcular_risco_erosao(
        ndvi=0.75,
        elevacao=200.0,
        precipitacao_anual=600.0,
        humidade_solo=0.35
    )
    assert risco_baixo in ("Baixo", "Médio")
