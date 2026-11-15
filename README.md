# 🛰️ Dados da NASA no S.O.L.O. — Guia técnico

> **NASA International Space Apps Challenge 2026** · Desafio *Field Shift: Adapting Farms with NASA Data*
> Documento partilhado entre as equipas de **front-end** (`front-end/`) e **back-end** (`back-end/`).

Este documento explica **que dados da NASA usamos, como os tratamos, o que já está implementado e o que falta**. Qualquer pessoa da equipa deve conseguir lê-lo e perceber o que se passa nos dados — sem ter de abrir o código.

---

## 1. Sumário

| | |
|---|---|
| **Missão usada** | NASA POWER (Agroclimatology) — já implementada, a sério, com dados reais |
| **Endpoint** | `https://power.larc.nasa.gov/api/temporal/daily/point` |
| **Parâmetros** | `T2M` `T2M_MAX` `T2M_MIN` `PRECTOTCORR` `RH2M` `ALLSKY_SFC_SW_DWN` `WS2M` |
| **Community** | `AG` (Agroclimatology) |
| **Resolução** | 0,5° × 0,625° (~50 km) para meteorologia · 1° × 1° para parâmetros solares |
| **Sentinela** | `-999` = sem medição nesse dia |
| **Atraso** | ~2 a 4 dias (a NASA publica com atraso) |
| **API key** | Não é preciso. Todas as missões usadas são públicas e gratuitas. |

O que **ainda não** está implementado: **SMAP** (humidade do solo medida), **ECOSTRESS** (estresse térmico) e **GPM IMERG** (chuva em tempo quase real). Ver [§9](#9-o-que-falta-smap-ecostress-gpm).

---

## 2. Porquê a NASA POWER

Das quatro missões que o design system indica, escolhemos a POWER como base porque:

- **É REST, pública e sem API key** — o que permite construir a demo sem dependências nem custos.
- **Cobre o ciclo agronómico completo**: temperatura, chuva, humidade do ar, radiação solar e vento.
- **Tem série histórica longa** — permite não só descrever "hoje" mas calcular o **balanço hídrico do solo** e dizer à Dona Maria se a terra está seca.
- **A mesma resposta serve a 3 ecrãs** — Início, Previsão do Tempo e Minha Terra e Horta.

---

## 3. Pipeline de dados

```text
   NASA POWER (REST público, sem API key)
              │
              │  fetch server-side  (revalidate: 86400)
              ▼
   ┌──────────────────────────┐
   │ lib/nasa/client.ts       │  busca + cache de 24h + fallback
   └────────────┬─────────────┘
                ▼
   ┌──────────────────────────┐
   │ lib/nasa/normalize.ts    │  descarta dias sem medição (-999),
   │                          │  formata datas, calcula médias
   └────────────┬─────────────┘
                ▼
   ┌──────────────────────────┐
   │  AgroSummary (tipo)      │  formato normalizado e estável
   └────────────┬─────────────┘
                │
       ┌────────┴─────────┐
       ▼                  ▼
 lib/agronomia.ts    Ecrãs (Server Components)
 (balanço hídrico)   → HTML já com os dados
```

### 3.1 Camadas e ficheiros

| Camada | Ficheiro | Responsabilidade |
|---|---|---|
| Proxy REST | `front-end/src/app/api/nasa/power/route.ts` | Endpoint público `/api/nasa/power` para o browser e para o back-end |
| Cliente | `front-end/src/lib/nasa/client.ts` | Busca no servidor, cache de 24h, fallback se a NASA falhar |
| Normalização | `front-end/src/lib/nasa/normalize.ts` | Resposta crua → `AgroSummary` |
| Modelo agronómico | `front-end/src/lib/agronomia.ts` | ETo + balanço hídrico do solo |
| Tipos | `front-end/src/types/nasa.ts` | `NasaPowerResponse`, `DailyPoint`, `AgroSummary` |

---

## 4. NASA POWER — os parâmetros que usamos

Resposta real da API para Feira de Santana (BA), dia 10/11/2026:

```json
{
  "T2M":               25.06,   // temperatura média a 2 m (°C)
  "T2M_MAX":           29.73,   // temperatura máxima a 2 m (°C)
  "T2M_MIN":           22.44,   // temperatura mínima a 2 m (°C)
  "PRECTOTCORR":        5.92,   // precipitação diária corrigida (mm)
  "RH2M":              79.47,   // humidade relativa a 2 m (%)
  "ALLSKY_SFC_SW_DWN": 20.78,   // radiação solar global descendente (MJ/m²/dia)
  "WS2M":               2.78    // velocidade do vento a 2 m (m/s)
}
```

| Parâmetro | Unidade | Para que serve no S.O.L.O. |
|---|---|---|
| `T2M` | °C | Temperatura do "hoje" no dashboard e no ecrã Clima |
| `T2M_MAX` / `T2M_MIN` | °C | Amplitude térmica — entra na fórmula de ETo (Hargreaves/Penman-Monteith) |
| `PRECTOTCORR` | mm | Chuva — o motor do balanço hídrico; decide se é preciso regar |
| `RH2M` | % | Humidade do ar — entra na equação de ETo |
| `ALLSKY_SFC_SW_DWN` | MJ/m²/dia | Radiação solar — a energia que evapora a água do solo |
| `WS2M` | m/s | Vento — maior vento, maior evaporação |

### 4.1 quirks da API (importante!)

1. **Sentinela `-999`** — dias sem medição vêm como `-999` (o header da resposta traz `"fill_value": -999.0`). **Tem de ser filtrado**, senão entra como temperatura de −999 °C e estraga tudo. É o que o `normalize.ts` faz.
2. **Atraso de ~2 a 4 dias** — o "hoje" da NASA não existe. O último dia com dados a 15/11/2026 era **11/11/2026**. Por isso a interface diz **"os últimos 7 dias"** e **"última observação do satélite: 11/11/2026"** em vez de fingir uma previsão.
3. **Radiação solar é mais grosseira** — os parâmetros solares estão a 1° × 1°, a meteorologia a 0,5° × 0,625°. Para a horta da Dona Maria (120 m²) estamos muito acima da resolução em qualquer dos casos: isto é **clima de região**, não microclima de canteiro.
4. **Tempo standard = LST** (Local Solar Time), não UTC.
5. **Melhoria retroactiva** — passados 2-3 meses, os dados são substituídos por produtos climáticos de melhor qualidade (MERRA-2). O mesmo URL pode devolver números ligeiramente diferentes mais tarde. É por isso que o cache é de 24h e não permanente.

---

## 5. O formato normalizado (`AgroSummary`)

Os ecrãs **nunca** vêem a resposta crua da NASA. Recebem sempre este tipo:

```ts
interface DailyPoint {
  date: string;        // "20261111"
  label: string;       // "11 de nov"
  dayOfWeek: string;   // "Qua"
  dayNumber: string;   // "11"
  tMax: number; tMin: number; tMean: number;
  rainMm: number;
  humidity: number;
  radiation: number;
  windSpeed: number;
  condition: "sun" | "cloud" | "rain";   // escolhe o ícone
}

interface AgroSummary {
  latitude: number; longitude: number; elevationM: number;
  current: DailyPoint | null;       // último dia com medição válida
  last7: DailyPoint[];              // últimos 7 dias (mais recente primeiro)
  series: DailyPoint[];             // série completa (para o balanço hídrico)
  monthlyRainMm: Record<string, number>;
  annualRainMm: number;
  avgTMax: number; avgTMin: number; avgHumidity: number;
  lastSatellitePass: string | null; // "20261111"
  daysSinceRain: number;
}
```

---

## 6. O modelo agronómico do solo

Ficheiro: **`front-end/src/lib/agronomia.ts`**

Isto é o que permite dizer à Dona Maria *"o solo está seco, regue"* em vez de mostrar um número arbitrário.

### 6.1 ETo — Penman-Monteith (FAO-56, equação 6)

Evapotranspiração de referência, em mm/dia, usando os dados reais da NASA:

```
ETo = [0,408 · Δ · (Rs − G) + γ · 900/(T+273) · u₂ · (es − ea)]
      ─────────────────────────────────────────────────────────────
                     Δ + γ · (1 + 0,34 · u₂)
```

Com:

```
es(T) = 0,6108 · exp(17,27·T / (T + 237,3))          [kPa]   pressão de vapor de saturação
ea    = es · RH / 100                                              pressão de vapor actual
Δ     = 4098 · es(T) / (T + 237,3)²                    [kPa/°C] inclinação da curva
P     = 101,3 · ((293 − 0,0065·z) / 293)^5,26         [kPa]   pressão atmosférica (z = altitude)
γ     = 0,000665 · P                                  [kPa/°C] constante psicrométrica
u₂    = max(0,5, WS2M)                               [m/s]    vento a 2 m (mínimo FAO-56)
Rs    = ALLSKY_SFC_SW_DWN                             [MJ/m²/dia]
```

Quando a radiação não existe (`-999`), usa-se a **radiação extraterrestrial** (eq. 21):

```
Ra = (24·60/π) · Gsc · dr · [ωs·sin(φ)·sin(δ) + cos(φ)·cos(δ)·sin(ωs)]

Gsc = 0,082 · dr = 1 + 0,033·cos(2πJ/365) · δ = 0,409·sin(2πJ/365 − 1,39)
ωs  = arccos(−tan(φ)·tan(δ))
```

### 6.2 Balanço hídrico do solo (modelo de balde)

Duas camadas, com capacidade de campo (FC) e ponto de murcha (WP) por textura:

| Textura | FC (cm³/cm³) | WP (cm³/cm³) | Prof. raízes |
|---|---|---|---|
| Arenoso | 0,13 | 0,05 | 30 cm |
| Franco | 0,22 | 0,10 | 40 cm |
| Argiloso | 0,30 | 0,15 | 40 cm |

A cada dia da série:

```
θ_raiz    += chuva / 400          (mm de água → fracção de volume)
θ_superf. += chuva / 50
Ks        = (θ − WP) / (FC − WP)      limitado a [0, 1]     ← stress hídrico
θ_raiz    -= ETo · Kc · Ks / 400      com Kc = 0,8
θ_superf. -= ETo · 0,6 · Ks / 50
θ         = min(θ, FC)   (drenagem)   e   θ = max(θ, WP)
```

Humidade final → `%` da capacidade de campo → semáforo:

| % | Estado | O que a app diz |
|---|---|---|
| ≥ 60 | `ideal` | "A terra está úmida na medida certa." |
| ≥ 35 | `atencao` | "O solo está a secar. Regue cedo de manhã." |
| < 35 | `seco` | "O solo está muito seco. Convém regar." |

### 6.3 O detalhe que faz toda a diferença

**O coeficiente de stress hídrico (Ks)** — equação 66 do FAO-56. Quando o solo seca, a planta fecha os estomas e transpira menos.

Sem o Ks, o modelo fazia a ET continuar a full speed mesmo com o solo seco, e a humidade **colapsava a 0%** — o que não acontece na realidade. Com o Ks, o solo encontra um equilíbrio seco mas plausível.

> No nosso caso real (Feira de Santana, 87 dias): ETo média **7,4 mm/dia** contra apenas **85 mm de chuva** → o solo fica a **23%** na raiz e **12%** na superfície. É seco — e é a verdade.

### 6.4 Limitações do modelo (ditas com todas as letras)

- É uma **estimativa**, não uma medição. A NASA **SMAP** mede a humidade do solo directamente — é o endpoint `/api/nasa/smap`, ainda por implementar.
- O balanço **não sabe se a Dona Maria regou**. Pode dizer "seco" num terreno que ela acabou de regar.
- A precipitação da POWER é à escala de ~50 km — é chuva de região, não da horta.
- O Kc = 0,8 é genérico para uma horta; uma cultura concreta teria o seu Kc ao longo do ciclo.

---

## 7. Que dados aparecem em cada ecrã

| Ecrã | Rota | Dados |
|---|---|---|
| **4. Meu Caderno da Terra** | `/inicio` | Temperatura e chuva do dia + humidade do solo (modelo) |
| **6. Previsão do Tempo** | `/previsao-do-tempo` | Os 7 parâmetros, 7 dias, alertas, data da última observação |
| **7. Minha Terra e Horta** | `/minha-terra-e-horta` | Balanço hídrico completo (ETo, Ks, θ) + chuva e vento |
| **8. Minhas Plantas** | `/minhas-plantas` | Dados da própria Dona Maria (`src/data/horta.json`) — sem API |

---

## 8. Performance, cache e resiliência

Decisões tomadas para o público-alvo (pessoas de 60+ anos, no campo, em 3G rural):

| Decisão | Porquê |
|---|---|
| **Fetch no servidor**, não no browser | O HTML já chega com os dados — sem ecrã em branco e sem gastar o pacote de dados da Dona Maria |
| **`revalidate: 86400`** no fetch e nas páginas | A NASA actualiza 1×/dia; mais do que isso é gastá-lo à toa |
| **ISR nas páginas** (`export const revalidate = 86400`) | Páginas estáticas, regeneradas 1×/dia |
| **`fallbackSummary()`** no `client.ts` | Se a NASA estiver em baixo, a app **não quebra** — mostra os valores por omissão e o rodapé avisa |
| **Filtro de `-999`** | Sem ele, um dia sem medição corrompe todas as médias |

Testar localmente com o header `Host`:

```bash
# série completa
curl "http://localhost:3000/api/nasa/power?lat=-12.97&lon=-39.51&start=20260817&end=20261115"

# subdomínio profile
curl -H "Host: profile.agrosolo.earth" http://localhost:3000/
```

---

## 9. O que falta: SMAP, ECOSTRESS, GPM

### 9.1 NASA SMAP — humidade do solo **medida**

É o upgrade natural do ecrã 7: hoje estimamos, amanhã medimos.

| | |
|---|---|
| **Produto** | SMAP L3 Enhanced 9 km Daily Surface Soil Moisture + L4 Root Zone |
| **Fonte** | NSIDC DAAC / GES DISC / CMR da NASA |
| **Autenticação** | ⚠️ **Earthdata Login (OAuth2)** — exige registar uma aplicação e um token. É o principal obstáculo |
| **Resolução** | 9 km (L3) · 36 m (L4) |
| **Granularidade** | Diária, com atraso de ~2-3 dias |
| **Formato** | HDF5 (precisa de `netCDF4-JavaScript` no browser, ou o back-end converte para JSON) |

**Recomendação:** implementar no **back-end** (`back-end/src/services/nasaSmapp.ts`), devolver JSON já normalizado, e o front-end só consome. Ver `back-end/API-CONTRATO.md`.

### 9.2 NASA ECOSTRESS — estresse térmico

| | |
|---|---|
| **Produto** | ECOSTRESS L2 Land Surface Temperature (70 m) e L4 ET / WUE |
| **Fonte** | LP DAAC / CMR — também exige Earthdata Login |
| **Porquê** | Detecta o **veranico** antes de as folhas queimarem. Mede a temperatura da copa, não do ar |
| **Cuidado** | A swath da ECOSTRESS passa só em órbita sobre a zona, ~2-3 passagens por semana. Não dá série diária contínua |

### 9.3 GPM IMERG — chuva em quase tempo real

| | |
|---|---|
| **Produto** | GPM IMERG Final Run V07, 0,1°/30 min |
| **Fonte** | GES DISC (Earthdata Login) ou a API pública do GPM |
| **Porquê** | Chuva que **acabou de acontecer**, não a de ontem. Complementa a POWER |

### 9.4 Ordem sugerida

1. **SMAP** — é o que falta para o ecrã 7 passar de estimativa a medição. Maior ganho com o esforço.
2. **GPM IMERG** — chuva recente, útil para o ecrã de Clima.
3. **ECOSTRESS** — o mais difícil ( swath sporadic + auth), mas o mais impressionante num pitch.

---

## 10. Transparência — requisito do júri

O critério de avaliação **"Data Transparency"** da NASA pede que se declarem as premissas e os limites. No interface isso está feito — e **não deve ser removido**:

| Onde | O que diz |
|---|---|
| Ecrã 6, rodapé | "Fonte: NASA POWER · Agroclimatology · Última observação do satélite: 11/11/2026 · Isto é apoio à decisão, não uma previsão garantida." |
| Ecrã 7, rodapé | "Fonte: NASA POWER + modelo de balanço hídrico (FAO-56) · Humidade estimada, não medida — a NASA SMAP dá a medição directa." |
| Ecrã 6, subtítulo | "Os últimos 7 dias" (e não "previsão") |

Regra da equipa: **se o dado não é medido, diz-se que é estimado.** A confiança da Dona Maria vale mais do que um número bonito.

---

## 11. Glossário rápido

| Termo | Significado |
|---|---|
| **ETo** | Evapotranspiração de referência — quanta água evapora de uma superfície com água suficiente |
| **ETa** | Evapotranspiração real — a que acontece de facto, com a planta e o solo como estão |
| **Ks** | Coeficiente de stress hídrico — reduz a ET quando o solo seca |
| **FC / WP** | Capacidade de campo / ponto de murcha — limites de humidade do solo |
| **θ** | Humidade volumétrica do solo (cm³/cm³) |
| **Kc** | Coeficiente de cultura — como a cultura usa a água face à ETo |
| **LST** | Local Solar Time — o tempo da NASA é hora solar local, não UTC |
| **ISMN** | International Soil Moisture Network —rede de medições no solo, para validar o SMAP |
| **Merra-2** | Reanálise do MERRA-2, a base do modelo meteorológico por trás da POWER |

---

## 12. Referências

- **FAO Irrigation & Drainage Paper 56** — Allen, Pereira, Raes, Smith (1998), *Crop evapotranspiration — Guidelines for computing crop water requirements*. [pdf](https://www.fao.org/4/x0490e/x0490e00.htm)
- **NASA POWER Docs** — [power.larc.nasa.gov/docs](https://power.larc.nasa.gov/docs/)
- **NASA SMAP** — [smap.jpl.nasa.gov](https://smap.jpl.nasa.gov/)
- **NASA ECOSTRESS** — [ecostress.jpl.nasa.gov](https://ecostress.jpl.nasa.gov/)
- **GPM IMERG** — [gpm.nasa.gov/data/imerg](https://gpm.nasa.gov/data/imerg)
- **Desafio oficial** — [spaceappschallenge.org/2026](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/?tab=details)

---

## 📌 Onde mexer

| Quero… | Vai a… |
|---|---|
| Mudar a forma como os dados são buscados | `front-end/src/lib/nasa/client.ts` |
| Mudar a normalização (datas, médias, condições) | `front-end/src/lib/nasa/normalize.ts` |
| Mudar o modelo do solo / a fórmula da ETo | `front-end/src/lib/agronomia.ts` |
| Adicionar um parâmetro da NASA | `client.ts` (lista `PARAMETERS`) → `normalize.ts` → `types/nasa.ts` |
| Implementar SMAP / ECOSTRESS / GPM | `back-end/src/services/` → ver `back-end/API-CONTRATO.md` |
| Mudar o que um ecrã mostra | `front-end/src/components/features/<ecrã>/` |
