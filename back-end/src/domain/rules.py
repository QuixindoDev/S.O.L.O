"""
Módulo de Regras Agronómicas e Cálculos de Carbono - Field Shift
Contém a lógica de negócio pura, fórmulas científicas de solo e matrizes de rotação de culturas.
"""

from typing import List, Tuple, Dict
from src.domain.entities import (
    AnaliseSolo,
    EstimativaCarbono,
    RecomendacaoRotacao,
    MetricasSatelite,
)


# ==============================================================================
# 1. CÁLCULO DE SCORE DE SAÚDE DO SOLO E RISCO DE EROSÃO
# ==============================================================================

def calcular_risco_erosao(
    ndvi: float,
    elevacao: float,
    precipitacao_anual: float,
    humidade_solo: float
) -> str:
    """
    Avalia a vulnerabilidade à erosão hídrica e eólica baseando-se em:
    - Cobertura vegetal (NDVI baixo = solo descoberto vulnerável)
    - Relevo/Topografia (elevação elevada geralmente associada a declives no Planalto de Angola)
    - Intensidade pluviométrica
    """
    fator_cobertura = 1.0 - max(0.0, min(1.0, (ndvi - 0.1) / 0.6))
    fator_pluviosidade = min(1.0, precipitacao_anual / 1400.0)
    fator_topografia = min(1.0, max(0.0, (elevacao - 800.0) / 1200.0))

    indice_vulnerabilidade = (0.50 * fator_cobertura) + (0.30 * fator_pluviosidade) + (0.20 * fator_topografia)

    if indice_vulnerabilidade > 0.70:
        return "Muito Alto"
    elif indice_vulnerabilidade > 0.48:
        return "Alto"
    elif indice_vulnerabilidade > 0.28:
        return "Médio"
    return "Baixo"


def calcular_score_saude_solo(metricas: MetricasSatelite) -> AnaliseSolo:
    """
    Calcula o score de saúde do solo (0 a 100) combinando 4 pilares agroecológicos:
    1. Vigor da Cobertura Vegetal (NDVI): até 40 pontos
    2. Disponibilidade Hídrica / Humidade da Superfície: até 30 pontos
    3. Equilíbrio Pluviométrico Agroclimático: até 15 pontos
    4. Estabilidade Topográfica e Conservação: até 15 pontos
    """
    # 1. Pontuação NDVI (faixa útil agronómica de 0.05 a 0.75)
    ndvi_clamped = max(-0.1, min(0.85, metricas.ndvi))
    if ndvi_clamped <= 0.10:
        pontos_ndvi = max(0.0, ndvi_clamped * 20.0)
    else:
        pontos_ndvi = min(40.0, 5.0 + ((ndvi_clamped - 0.10) / 0.65) * 35.0)

    # 2. Pontuação Humidade do Solo (0.0 a 1.0 - ideal entre 0.25 e 0.55)
    h = max(0.0, min(1.0, metricas.humidade_solo))
    if h < 0.15:
        # Estresse hídrico severo
        pontos_humidade = (h / 0.15) * 12.0
    elif h <= 0.50:
        # Faixa ótima para agricultura em sequeiro/irrigada
        pontos_humidade = 12.0 + ((h - 0.15) / 0.35) * 18.0
    else:
        # Excesso de humidade / risco de encharcamento
        pontos_humidade = max(15.0, 30.0 - ((h - 0.50) / 0.50) * 15.0)

    # 3. Pontuação Precipitação (milímetros / base anual)
    # No contexto de Angola (400mm no semiárido do sul a 1400mm no Planalto/Norte)
    precip = max(0.0, metricas.precipitacao)
    # Se a métrica vier em mm/dia (NASA POWER daily), converte para aproximação anual
    if precip < 30.0:  # Indicativo de média diária
        precip_anual = precip * 365.25
    else:
        precip_anual = precip

    if precip_anual < 350:
        pontos_chuva = (precip_anual / 350.0) * 6.0
    elif precip_anual <= 1200:
        pontos_chuva = 6.0 + ((precip_anual - 350.0) / 850.0) * 9.0
    else:
        pontos_chuva = max(8.0, 15.0 - ((precip_anual - 1200.0) / 1000.0) * 5.0)

    # 4. Risco de Erosão e Estabilidade
    risco_erosao = calcular_risco_erosao(
        ndvi=metricas.ndvi,
        elevacao=metricas.elevacao,
        precipitacao_anual=precip_anual,
        humidade_solo=metricas.humidade_solo
    )

    deducoes_erosao = {
        "Baixo": 15.0,
        "Médio": 10.0,
        "Alto": 5.0,
        "Muito Alto": 1.0,
    }
    pontos_estabilidade = deducoes_erosao.get(risco_erosao, 8.0)

    score_total = round(min(100.0, max(0.0, pontos_ndvi + pontos_humidade + pontos_chuva + pontos_estabilidade)), 1)

    # Classificação
    if score_total >= 80.0:
        classificacao = "Excelente"
        diagnostico = (
            "Solo com excelente cobertura vegetal e estabilidade hídrica. "
            "Apto para manter rotação de alto rendimento e consolidação de créditos de carbono."
        )
    elif score_total >= 65.0:
        classificacao = "Bom"
        diagnostico = (
            "Solo saudável com bom vigor fotossintético. Pequenas melhorias na rotação com leguminosas "
            "aumentarão o teor de carbono orgânico e a retenção de humidade."
        )
    elif score_total >= 45.0:
        classificacao = "Moderado"
        diagnostico = (
            "Solo em estado de alerta. Sinais moderados de perda de matéria orgânica ou estresse hídrico. "
            "A introdução imediata de leguminosas fixadoras é altamente recomendada."
        )
    elif score_total >= 25.0:
        classificacao = "Degradado"
        diagnostico = (
            "Solo degradado por monocultura contínua ou erosão superficial. Baixo vigor biológico. "
            "Prioridade crítica para culturas regenerativas com alto aporte de biomassa e nitrogénio."
        )
    else:
        classificacao = "Crítico"
        diagnostico = (
            "Solo severamente empobrecido e desprotegido. Risco iminente de desertificação localizada. "
            "Exige reflorestamento agroflorestal ou adubação verde intensiva imediata."
        )

    return AnaliseSolo(
        score_saude=score_total,
        classificacao_saude=classificacao,
        indice_ndvi=round(metricas.ndvi, 3),
        humidade_solo=round(metricas.humidade_solo, 3),
        precipitacao_anual=round(precip_anual, 1),
        elevacao_metros=round(metricas.elevacao, 1),
        risco_erosao=risco_erosao,
        diagnostico_detalhado=diagnostico,
    )


# ==============================================================================
# 2. MATRIZ DE ROTAÇÃO AGRONÓMICA REGENERATIVA
# ==============================================================================

def obter_matriz_rotacao(
    cultura_atual: str,
    score_saude: float,
    humidade_solo: float
) -> Tuple[RecomendacaoRotacao, List[RecomendacaoRotacao]]:
    """
    Retorna a cultura primária recomendada e alternativas complementares
    baseando-se na cultura atual exaurida e no score de saúde do solo.

    Regra central especificada:
    - Se cultura atual == 'Milho' e score < 50:
      Sugerir Feijão-frade ou Amendoim (fixação biológica de nitrogénio).
    """
    cultura_norm = cultura_atual.strip().lower()

    if "milho" in cultura_norm:
        if score_saude < 50.0:
            principal = RecomendacaoRotacao(
                cultura_recomendada="Feijão-frade",
                nome_cientifico="Vigna unguiculata",
                justificativa=(
                    "O monocultivo prolongado de Milho causou depleção severa de nitrogénio no solo. "
                    "O Feijão-frade realiza fixação biológica simbiótica de nitrogénio através de bactérias Rhizobium, "
                    "restaurando os nutrientes minerais essenciais sem custos químicos para o agricultor."
                ),
                beneficio_ecologico="Fixação biológica de até 80 kg N/ha, quebra do ciclo de pragas do milho e rápida cobertura foliar.",
                taxa_sequestro_adicional=1.25,
                compatibilidade_clima="Excelente adaptação ao clima tropical semiárido e subúmido de Angola; alta tolerância ao estresse térmico."
            )
            alternativa = RecomendacaoRotacao(
                cultura_recomendada="Amendoim",
                nome_cientifico="Arachis hypogaea",
                justificativa=(
                    "Excelente alternativa leguminosa que combina alta capacidade de fixação de nitrogénio atmosférico "
                    "com elevado valor comercial no mercado local angolano (ginguba)."
                ),
                beneficio_ecologico="Aporte substancial de biomassa radicular, melhoria da aeração do solo e cobertura contra erosão laminar.",
                taxa_sequestro_adicional=1.10,
                compatibilidade_clima="Adequado para solos arenosos e franco-arenosos com boa drenagem."
            )
            return principal, [alternativa]
        else:
            principal = RecomendacaoRotacao(
                cultura_recomendada="Soja Tropical / Feijão-de-porco",
                nome_cientifico="Canavalia ensiformis",
                justificativa=(
                    "Solo em condição favorável. O consórcio ou rotação com Feijão-de-porco previne o esgotamento futuro, "
                    "aumenta o teor de matéria orgânica estável e prepara o terreno para safras de alto rendimento."
                ),
                beneficio_ecologico="Produção maciça de matéria seca verde (>6 t/ha) e descompactação biológica de subsuperfície.",
                taxa_sequestro_adicional=1.40,
                compatibilidade_clima="Ideal para regiões do Planalto Central angolano (Huambo, Bié, Huíla)."
            )
            alternativa = RecomendacaoRotacao(
                cultura_recomendada="Feijão-frade",
                nome_cientifico="Vigna unguiculata",
                justificativa="Ciclo curto (60 a 75 dias), permitindo rápida rotação e aproveitamento de janelas de chuva.",
                beneficio_ecologico="Fixação biológica de nitrogénio e manutenção do banco de sementes da comunidade.",
                taxa_sequestro_adicional=1.05,
                compatibilidade_clima="Elevada tolerância à estiagem temporária."
            )
            return principal, [alternativa]

    elif "mandioca" in cultura_norm:
        principal = RecomendacaoRotacao(
            cultura_recomendada="Feijão-frade consorciado com Mucuna-preta",
            nome_cientifico="Mucuna pruriens",
            justificativa=(
                "A mandioca possui longo ciclo vegetativo e extrai grande quantidade de potássio, deixando o solo desprotegido nos meses iniciais. "
                "A mucuna e o feijão-frade suprimem ervas daninhas, controlam nematoides e depositam densa cobertura morta."
            ),
            beneficio_ecologico="Reciclagem profunda de potássio, supressão de infestantes e proteção contra chuvas torrenciais.",
            taxa_sequestro_adicional=1.35,
            compatibilidade_clima="Adaptado a solos ácidos de baixa fertilidade típicos das províncias de Uíge, Malanje e Cuanza Norte."
        )
        alternativa = RecomendacaoRotacao(
            cultura_recomendada="Amendoim (Ginguba)",
            nome_cientifico="Arachis hypogaea",
            justificativa="Consórcio intercalar com a mandioca nos primeiros 90 dias, gerando renda rápida antes do fecho da copa da mandioca.",
            beneficio_ecologico="Fixação de nitrogénio e cobertura superficial do solo entre linhas.",
            taxa_sequestro_adicional=1.00,
            compatibilidade_clima="Excelente rendimento em solos leves das zonas tropicais."
        )
        return principal, [alternativa]

    elif any(term in cultura_norm for term in ["massango", "massambala", "sorgo", "milheto"]):
        principal = RecomendacaoRotacao(
            cultura_recomendada="Feijão-guandu",
            nome_cientifico="Cajanus cajan",
            justificativa=(
                "Em regiões com regimes hídricos restritos (Cunene, Namibe, Huíla), o Guandu atinge até 2 metros com raízes pivotantes profundas "
                "que rompem camadas adensadas e captam água onde o Massango não alcança."
            ),
            beneficio_ecologico="Fixação biológica de até 100 kg N/ha e forragem perene rica em proteína para períodos de seca prolongada.",
            taxa_sequestro_adicional=1.45,
            compatibilidade_clima="Resistência extrema à aridez e temperaturas elevadas."
        )
        alternativa = RecomendacaoRotacao(
            cultura_recomendada="Feijão-frade",
            nome_cientifico="Vigna unguiculata",
            justificativa="Cultura tradicional rústica que complementa perfeitamente a dieta camponesa e restabelece a microfauna do solo.",
            beneficio_ecologico="Cobertura de solo rápida e ciclagem biológica de fósforo.",
            taxa_sequestro_adicional=1.10,
            compatibilidade_clima="Excelente para o clima semiárido."
        )
        return principal, [alternativa]

    elif "algodão" in cultura_norm or "algodao" in cultura_norm:
        principal = RecomendacaoRotacao(
            cultura_recomendada="Crotalária",
            nome_cientifico="Crotalaria juncea",
            justificativa=(
                "O algodoeiro é altamente suscetível a nematoides de galhas e provoca compactação superficial. "
                "A Crotalária atua como planta armadilha contra pragas e gera alta massa verde."
            ),
            beneficio_ecologico="Controle biológico de nematoides e sequestro rápido de carbono no perfil superficial.",
            taxa_sequestro_adicional=1.50,
            compatibilidade_clima="Ampla adaptabilidade no norte e centro de Angola."
        )
        alternativa = RecomendacaoRotacao(
            cultura_recomendada="Amendoim",
            nome_cientifico="Arachis hypogaea",
            justificativa="Rotação comercial para manter atividade económica familiar pós-colheita do algodão.",
            beneficio_ecologico="Reposição de nitrogénio mineral e melhoria da agregação do solo.",
            taxa_sequestro_adicional=1.05,
            compatibilidade_clima="Muito adaptável."
        )
        return principal, [alternativa]

    # Caso genérico / Outras culturas
    if score_saude < 50.0:
        principal = RecomendacaoRotacao(
            cultura_recomendada="Feijão-frade",
            nome_cientifico="Vigna unguiculata",
            justificativa=(
                "Para recuperar o solo empobrecido (score < 50), o Feijão-frade é a leguminosa mais recomendada "
                "pela sua capacidade de fixar nitrogénio do ar, dispensando adubos químicos caros e promovendo recuperação rápida."
            ),
            beneficio_ecologico="Restauração de micorrizas, aumento da retenção de água e cobertura do solo.",
            taxa_sequestro_adicional=1.20,
            compatibilidade_clima="Clima tropical e subtropical de Angola."
        )
        alternativa = RecomendacaoRotacao(
            cultura_recomendada="Amendoim",
            nome_cientifico="Arachis hypogaea",
            justificativa="Diversificação alimentar e fixação de azoto em solos moderadamente arenosos.",
            beneficio_ecologico="Aporte de matéria orgânica e enriquecimento da camada arável.",
            taxa_sequestro_adicional=1.00,
            compatibilidade_clima="Solos francos e arenosos."
        )
    else:
        principal = RecomendacaoRotacao(
            cultura_recomendada="Consórcio Policultural com Leguminosas",
            nome_cientifico="Leguminosae spp.",
            justificativa=(
                "Manutenção da saúde do solo mediante cultivo consorciado com leguminosas de cobertura, "
                "garantindo resiliência climática contínua e incremento constante do estoque de carbono."
            ),
            beneficio_ecologico="Aumento contínuo da microbiota aeróbica e estabilização de agregados do solo.",
            taxa_sequestro_adicional=1.15,
            compatibilidade_clima="Totalmente compatível com a sazonalidade agrícola angolana."
        )
        alternativa = RecomendacaoRotacao(
            cultura_recomendada="Feijão-guandu",
            nome_cientifico="Cajanus cajan",
            justificativa="Formação de cercas vivas e barreira contra ventos secos dessecantes.",
            beneficio_ecologico="Descompactação biológica de subsolo e abrigo de polinizadores nativos.",
            taxa_sequestro_adicional=1.30,
            compatibilidade_clima="Resistente a secas estivais."
        )

    return principal, [alternativa]


# ==============================================================================
# 3. CÁLCULO DE CRÉDITOS DE CARBONO
# ==============================================================================

def calcular_estimativa_carbono(
    area_hectares: float,
    taxa_sequestro_base: float,
    score_saude: float,
    margem_seguranca: float = 0.20,
    preco_por_credito_usd: float = 20.0
) -> EstimativaCarbono:
    """
    Aplica a fórmula científica de quantificação de carbono regenerativo:
    Créditos líquidos = (Hectares × Taxa de Sequestro × 3.67) × (1 - Margem de Segurança)

    Onde:
    - 3.67 é a razão estequiométrica entre a molécula de CO2 (44 g/mol) e o Carbono atómico (12 g/mol).
    - Margem de segurança (buffer pool de 20%) cobre riscos de reversão ou incerteza amostral conforme normas globais (Verra / Gold Standard).
    - Solos com score de saúde mais baixo apresentam maior potencial marginal de adição de carbono (adicionalidade alta).
    """
    if area_hectares <= 0:
        raise ValueError("Área em hectares deve ser positiva.")

    # Ajuste de adicionalidade: solos mais degradados acumulam carbono a taxas mais elevadas
    # quando recebem manejo regenerativo adequado (hipótese de saturação de carbono do solo).
    fator_adicionalidade = 1.0
    if score_saude < 40.0:
        fator_adicionalidade = 1.15
    elif score_saude > 75.0:
        fator_adicionalidade = 0.90

    taxa_efetiva = round(taxa_sequestro_base * fator_adicionalidade, 2)

    return EstimativaCarbono(
        area_hectares=area_hectares,
        taxa_sequestro=taxa_efetiva,
        fator_conversao_co2=3.67,
        margem_seguranca=margem_seguranca,
        preco_por_credito_usd=preco_por_credito_usd
    )
