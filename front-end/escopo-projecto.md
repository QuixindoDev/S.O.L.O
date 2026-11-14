# S.O.L.O. - Smart Observation Land Optimization
> **NASA International Space Apps Challenge 2026**  
> **Desafio:** [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/?tab=details)  
> **Repositório:** `QuixindoDev/S.O.L.O` | **Branch:** `requisitos`  
> **Visualização Web:** Abra o arquivo [`index.html`](file:///home/adasilve/WWW/NASA/index.html) no navegador para uma interface interativa completa.

---

## 1. Visão Geral do Projeto

O **S.O.L.O.** é uma plataforma de suporte à decisão voltada para a agricultura regenerativa e adaptativa. O projeto traduz dados complexos de satélites da NASA em recomendações visuais, práticas e em linguagem leiga para que agricultores planejem a rotação ideal de suas culturas, protejam seus solos e conservem água diante do agravamento das mudanças climáticas.

---

## 2. O Problema e o Contexto Global

- **Mudanças Climáticas e Incerteza:** Oscilações drásticas de temperatura, secas severas e chuvas imprevisíveis inviabilizam o uso exclusivo do conhecimento tradicional de safras passadas.
- **Degradação do Solo:** Monoculturas sucessivas provocam erosão, exaustão de nutrientes da rizosfera e perda drástica da capacidade de retenção hídrica.
- **O Abismo de Dados (Data Gap):** A NASA disponibiliza terabytes de observações da Terra diariamente, porém em formatos científicos (NetCDF, HDF5, GeoTIFF) inacessíveis ao pequeno e médio produtor rural.

---

## 3. Objetivos Centrais do S.O.L.O.

1. **Simulador de Rotação de Culturas:** Permitir que o produtor teste diferentes sequências de culturas (ex: Milho -> Feijão-Caupi -> Braquiária) e visualize o impacto antes do plantio.
2. **Prioridades Personalizadas:** O sistema adapta suas recomendações conforme o objetivo prioritário do agricultor:
   - Economia máxima de água (conservação hídrica).
   - Regeneração de nitrogênio e matéria orgânica no solo.
   - Resiliência máxima contra choques térmicos e secas.
   - Rentabilidade financeira da safra.
3. **Tradução em Linguagem Simples:** Transformar índices espectrais em alertas diretos ("Janela ideal para semear", "Risco de estresse hídrico na floração").

---

## 4. Stack Tecnológica Oficial do Frontend

A aplicação será desenvolvida utilizando a seguinte stack moderna e escalável:

- **Next.js (App Router):** 
  - Renderização otimizada com Server Components e Client Components.
  - Route Handlers (`src/app/api/nasa/power/route.ts`) atuando como proxy com cache (`revalidate: 86400`) para a API NASA POWER, evitando problemas de CORS e requisições repetidas.
- **React 18 / 19:** Componentização reativa para simulação interativa em tempo real.
- **TypeScript:** Tipagem estrita para todos os parâmetros orbitais e modelos de dados agronômicos.
- **Tailwind CSS:** Design System utilitário, paleta espacial-agrícola e alto contraste para visualização sob luz solar no campo.
- **Bibliotecas Auxiliares:**
  - Mapas: **Leaflet** / **React-Leaflet** ou **MapLibre GL**.
  - Gráficos: **Chart.js** (com `react-chartjs-2`) ou **Recharts**.
  - Ícones: **Lucide React** ou **Font Awesome**.

---

## 5. Arquitetura de Diretórios Proposta (Next.js)

```text
solo-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx              // Shell global, fontes e metatags
│   │   ├── page.tsx                // Dashboard unificado com simulador
│   │   ├── api/nasa/power/route.ts // Proxy e cache para dados NASA POWER
│   │   └── globals.css             // Diretivas Tailwind e tokens de cores
│   ├── components/
│   │   ├── FarmMap.tsx             // Componente de mapa interativo (Leaflet)
│   │   ├── RotationSimulator.tsx   // Seletor de ciclos de rotação
│   │   ├── SustainabilityRadar.tsx // Gráfico de sustentabilidade hídrica e solo
│   │   ├── MeteoCards.tsx          // Indicadores de temperatura, chuva e umidade
│   │   └── RiskAlerts.tsx          // Semáforo e orientações em linguagem leiga
│   ├── hooks/
│   │   ├── useNasaAgro.ts          // Hook para consumo da API NASA POWER
│   │   └── useSimulator.ts         // Motor de cálculo de resiliência e scores
│   ├── types/
│   │   ├── nasa.d.ts               // Tipos e interfaces das respostas da NASA
│   │   └── agronomy.d.ts           // Tipos de culturas, solos e biomas
│   └── data/
│       └── cropsMatrix.json        // Base de dados das culturas e coeficientes
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 6. Fontes de Dados e APIs da NASA

| Conjunto de Dados / Satélite | Parâmetros Utilizados | Aplicação no Frontend do S.O.L.O. |
| :--- | :--- | :--- |
| **NASA POWER** (Agroclimatology) | `T2M`, `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `RH2M`, `ALLSKY_SFC_SW_DWN` | Cálculo do balanço hídrico diário, histórico de chuvas e evapotranspiração de referência ($ET_0$). API REST aberta e gratuita. |
| **NASA SMAP** | Umidade volumétrica superficial (0-5 cm) e na zona radicular (0-100 cm) | Diagnóstico da reserva de água no solo para suporte à germinação e risco de seca. |
| **NASA ECOSTRESS** (na ISS) | Evapotranspiração Real ($ET_a$) e Evaporative Stress Index (ESI) | Alerta precoce de estresse térmico na copa da lavoura. |
| **GPM IMERG** | Precipitação calibrada por satélite em tempo quase real | Monitoramento de anomalias de precipitação local. |
| **MODIS / VIIRS** | NDVI (Índice de Vigor Vegetativo) e NDWI | Comparação da recuperação de biomassa e verdor safra a safra. |

---

## 7. Como Visualizar

Para visualizar toda a documentação interativa com o protótipo funcional do simulador e gráficos da NASA:
- Abra o arquivo [`index.html`](file:///home/adasilve/WWW/NASA/index.html) em qualquer navegador moderno.
