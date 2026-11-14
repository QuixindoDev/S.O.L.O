# 🌍 Field Shift — Backend

> **Democratização do mercado voluntário de carbono para pequenos agricultores em Angola através de sensoriamento remoto gratuito (NASA POWER + Google Earth Engine).**

---

## 🎯 1. Visão Geral do Produto

* **O Problema:** Pequenos agricultores em Angola não conseguem aceder ao mercado voluntário de carbono porque medir, verificar e certificar o solo de forma tradicional (análises químicas laboratoriais in loco por auditores internacionais) custa dezenas de milhares de dólares.
* **A Solução:** Uma plataforma baseada em **Arquitetura Hexagonal (Ports & Adapters)** que cruza coordenadas geográficas com dados de satélite abertos da **NASA POWER** e **Google Earth Engine (GEE)** para diagnosticar a saúde do solo, prescrever rotação de culturas regenerativas e calcular créditos de carbono comercializáveis ($tCO_2e$) com alta transparência científica.

---

## 🏛️ 2. Arquitetura Hexagonal (Ports & Adapters)

A base de código isola rigidamente as regras de negócio puras (domínio) das integrações tecnológicas (FastAPI, Google Earth Engine, NASA POWER, PostgreSQL/PostGIS):

```text
field_shift_backend/
├── src/
│   ├── domain/                    # O Coração: Regras puras e fórmulas científicas
│   │   ├── entities.py            # Modelos de Domínio (Fazenda, AnaliseSolo, EstimativaCarbono)
│   │   └── rules.py               # Lógica agronómica e fórmula de créditos
│   │
│   ├── application/               # A Orquestração: Casos de uso e Portas (Contratos)
│   │   ├── use_cases/             # AnalyzeLandUseCase
│   │   └── ports/                 # SatellitePort e LandAnalysisRepositoryPort
│   │
│   └── infrastructure/            # O Mundo Exterior: Frameworks e Adaptadores
│       ├── inbound/http/          # FastAPI (Routers, Schemas Pydantic)
│       └── outbound/              
│           ├── persistence/       # PostgreSQL / PostGIS / SQLite (SQLAlchemy)
│           └── external/          # Adaptadores NASA POWER e Google Earth Engine (GEE)
│
├── tests/                         # Testes automatizados (Unitários e Integração)
├── main.py                        # Arranque da aplicação FastAPI
├── requirements.txt               # Dependências Python
└── pytest.ini                     # Configuração de testes
```

---

## 🔬 3. Fundamentação Científica e Fórmulas

### 3.1. Quantificação de Créditos de Carbono ($tCO_2e$)

O cálculo segue os padrões do **IPCC** e metodologias reconhecidas no mercado voluntário (ex: **Verra VM0042**):

$$\text{Créditos líquidos} = (\text{Hectares} \times \text{Taxa de Sequestro} \times 3.67) \times (1 - \text{Margem de Segurança})$$

* **Hectares:** Área total da propriedade agrícola sob manejo regenerativo.
* **Taxa de Sequestro:** Adição anual de carbono orgânico no solo ($t C / \text{ha} / \text{ano}$) pela cultura regenerativa recomendada (ex: $1.25\,t C/\text{ha}/\text{ano}$ para Feijão-frade).
* **3.67 ($44/12$):** Razão molecular de conversão estequiométrica entre o dióxido de carbono ($CO_2$) e o carbono atómico ($C$).
* **Margem de Segurança ($20\%$ buffer pool):** Retenção prudencial padrão internacional para cobrir riscos de reversão ou incerteza amostral.
* **Valor em USD:** $\text{Créditos Líquidos} \times \text{Preço de Mercado}$ (padrão: $\$20.00 / tCO_2e$).

### 3.2. Matriz de Rotação Agronómica para Angola

* **Milho empobrecido (Score de saúde < 50):** Sugere **Feijão-frade (*Vigna unguiculata*)** ou **Amendoim (*Arachis hypogaea*)** devido à fixação biológica simbiótica de nitrogénio através de bactérias *Rhizobium*, quebrando o ciclo de pragas e recuperando a fertilidade mineral sem químicos.
* **Milho em solo fértil (Score $\ge$ 50):** Sugere consórcio com **Feijão-de-porco (*Canavalia ensiformis*)** ou rotação com **Soja Tropical** para manter o aporte de biomassa verde ($>6\,t/\text{ha}$).
* **Mandioca:** Rotação/consórcio com **Mucuna-preta** ou **Feijão-frade** para ciclagem de potássio e cobertura foliar contra erosão.
* **Massango / Massambala (Semiárido do Sul: Cunene, Namibe, Huíla):** Rotação com **Feijão-guandu (*Cajanus cajan*)**, cujas raízes pivotantes profundas atingem até 2 metros.

---

## 🚀 4. Como Executar

### 4.1. Instalação do Ambiente Virtual

```bash
cd field_shift_backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4.2. Iniciar o Servidor FastAPI

```bash
uvicorn main:app --reload --port 8000
```

* **Swagger UI interativo:** `http://localhost:8000/docs`
* **Redoc:** `http://localhost:8000/redoc`
* **Health Check:** `http://localhost:8000/api/v1/health`

### 4.3. Execução dos Testes Automatizados

```bash
pytest -v
```

---

## 📡 5. Principais Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/v1/analyze` | Recebe coordenadas, área e cultura; executa satélite e retorna diagnóstico completo |
| `GET` | `/api/v1/analyses` | Lista diagnósticos históricos salvos |
| `GET` | `/api/v1/analyses/{id}` | Recupera diagnóstico por ID |
| `GET` | `/api/v1/health` | Estado dos adaptadores (NASA POWER, GEE e Banco de Dados) |
| `GET` | `/api/v1/crops` | Catálogo de culturas angolanas e leguminosas regenerativas |
| `GET` | `/api/v1/carbon-calculator-info` | Detalhamento da metodologia e parâmetros de carbono |

### Exemplo de Requisição (`POST /api/v1/analyze`):

```json
{
  "latitude": -12.776,
  "longitude": 15.734,
  "area_hectares": 5.0,
  "cultura_atual": "Milho",
  "nome": "Talhão Esperança - Huambo",
  "localizacao_descricao": "Huambo, Angola",
  "margem_seguranca": 0.20,
  "preco_carbono_usd": 20.0
}
```

---

## 🛰️ 6. Adaptadores de Satélite

* **NASA POWER Adapter (`NasaPowerAdapter`):** Faz requisições HTTP REST à API pública global da NASA POWER (sem necessidade de chaves pagas), extraindo dados agroclimatológicos de 25 anos (temperatura a 2m, precipitação acumulada, humidade do solo `GWETTOP`/`GWETROOT` e relevo).
* **Google Earth Engine (`GEEAdapter`):** Conecta-se às coleções Sentinel-2 / Landsat e SRTM. Se as credenciais do Google Cloud ainda não estiverem configuradas localmente, opera de forma resiliente combinando a NASA POWER com o modelo espectral de refletância calibrado.
* **Mock GEE Adapter (`MockGEEAdapter`):** Simulação determinística e ultra-rápida para ambientes de desenvolvimento offline e esteiras de CI/CD.
