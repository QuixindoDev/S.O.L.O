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
back-end/
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
cd back-end
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

### 🔑 Regra Arquitetural de Identificadores (IDs vs UUIDs):
* **Base de Dados:** Chave primária numérica sequencial auto-incrementada (`id: Integer`) para máxima performance de índices e integridade referencial.
* **Comunicação Externa:** Toda a API, rotas, payloads JSON e sincronização offline-first utilizam exclusivamente `UUID` (gerados automaticamente ou fornecidos pelo cliente).

---

## 📡 5. Principais Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/v1/farmers` | Registar novo agricultor familiar (nome, telefone para pagamentos móveis, cooperativa) |
| `GET` | `/api/v1/farmers` | Listar todos os agricultores cadastrados com paginação |
| `GET` | `/api/v1/farmers/{farmer_uuid}` | Obter detalhes de um agricultor por UUID |
| `GET` | `/api/v1/farmers/{farmer_uuid}/analyses` | Listar histórico de parcelas/análises associadas a um agricultor (1:N) |
| `POST` | `/api/v1/analyze` | Recebe coordenadas, área, cultura e `farmer_uuid`; executa satélite e persiste diagnóstico |
| `GET` | `/api/v1/analyses` | Lista diagnósticos históricos salvos (baseado em UUIDs) |
| `GET` | `/api/v1/analyses/{uuid}` | Recupera diagnóstico específico por UUID |
| `GET` | `/health` / `/api/v1/health` | Estado dos adaptadores (NASA POWER, GEE e Banco de Dados) |
| `GET` | `/api/v1/crops` | Catálogo de culturas angolanas e leguminosas regenerativas |
| `GET` | `/api/v1/carbon-calculator-info` | Detalhamento da metodologia e parâmetros de carbono |
| `GET` | `/api/v1/profile` | Perfil da propriedade (dono, sítio, coordenadas, solo, área) — usado por todos os ecrãs |
| `GET` | `/api/v1/horta` | Visão geral da horta: canteiros + plantas + colheitas |
| `GET` / `POST` | `/api/v1/plots` | Listar / criar canteiros |
| `DELETE` | `/api/v1/plots/{plot_ref}` | Remover canteiro (e as plantas dele) |
| `GET` / `POST` | `/api/v1/plants` | Listar / criar plantas |
| `PATCH` | `/api/v1/plants/{plant_ref}` | Actualizar estado, cuidados ou dias até à colheita |
| `DELETE` | `/api/v1/plants/{plant_ref}` | Remover planta |
| `GET` / `POST` | `/api/v1/harvests` | Listar / registar colheitas |
| `GET` | `/api/v1/finance/summary` | Resumo financeiro do mês (entrou, saiu, sobrou) |
| `GET` / `POST` | `/api/v1/finance/transactions` | Lançamentos do caderninho de contas |
| `GET` / `POST` | `/api/v1/agronomist/messages` | Conversa com a agrônoma |
| `POST` / `GET` | `/api/v1/auth/*` | Cadastro, verificação 2FA, login, perfil e logout |

### Datasets NASA (consumidos pelo front-end)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/nasa/power` | Série diária NASA POWER (temperatura, chuva, humidade, radiação, vento) — cache 24 h |
| `GET` | `/api/nasa/smap` | Humidade do solo (GWETTOP / GWETROOT) — cache 24 h |
| `GET` | `/api/nasa/ecostress` | Estresse térmico (requer credenciais NASA Earthdata — ainda não configurado) |
| `GET` | `/api/nasa/gpm` | Precipitação IMERG (requer credenciais NASA Earthdata — ainda não configurado) |

```bash
curl "http://localhost:8000/api/nasa/power?lat=-12.776&lon=15.739&start=20260101&end=20261231"
```

Variáveis de ambiente: `NASA_TIMEOUT_SECONDS` (timeout da NASA) e `CACHE_TTL_SECONDS` (TTL do cache, 86400 por omissão).

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
