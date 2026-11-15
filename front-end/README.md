# 🛰️ S.O.L.O. — Campo Amigo

> **NASA International Space Apps Challenge 2026**
> Desafio: *Field Shift: Adapting Farms with NASA Data*
> Repositório: `QuixindoDev/S.O.L.O` · Branch: `requisitos`

Plataforma de suporte à decisão para a **agricultura familiar em Angola**, que traduz dados de satélite da NASA em conselhos simples e visuais para quem tem mais de 60 anos e cultiva a terra.

---

## 🇦🇴 Convenções de localização (pt-Angola)

Todo o conteúdo (design `.pen` e código) segue o **português de Angola**, que segue o Acordo Ortográfico:

| Tema | Termo usado | Não usar |
|---|---|---|
| Humidade do solo | **humidade** | umidade |
| Nutriente | **nitrogénio** | nitrogênio |
| Ecrã | **ecrã** | tela |
| Mercado local | **mercado** | feira livre |
| Moeda | **Kz** (kwanza) | R$ / USD no UI |
| Telefone | **+244 9XX XXX XXX** | (XX) XXXXX-XXXX |
| Stress | **stresse térmico / hídrico** | estresse |

O design de referência é o ficheiro **`login copy.pen`** (pen.dev) — cidade de referência **Caxito - Bengo**, produtor **Dona Maria**, sítio **Sítio Recanto Verde**, agrónoma **Ana**.

---

## 📌 Onde meter cada coisa

> **Este é o guia principal para a divisão de tarefas.**
> O design completo dos 12 ecrãs está no ficheiro **`login copy.pen`** (pen.dev). Cada ecrã do design corresponde a **uma pasta/rota** indicada na tabela abaixo.

### Árvore de pastas do projecto

```text
src/
├── app/
│   ├── layout.tsx                    # Shell global: fonte Atkinson, metatags, <body>
│   ├── globals.css                   # TOKENS DO DESIGN (fonte de verdade)
│   ├── page.tsx                      # Landing / redirect → /entrar
│   │
│   ├── design-system/page.tsx        # Preview de todos os blocos de ui/
│   │
│   ├── (auth)/                       # Telas SEM barra lateral (login/cadastro)
│   │   ├── layout.tsx                # Top Bar + conteúdo centrado
│   │   ├── criar-conta/page.tsx      # Ecrã 1  — Criar Conta
│   │   ├── entrar/page.tsx           # Ecrã 1B — Entrar
│   │   ├── sms-enviado/page.tsx      # Ecrã 2  — SMS Enviado
│   │   └── verificar/page.tsx        # Ecrã 3  — Código de Segurança (2FA)
│   │
│   ├── (app)/                        # Telas COM barra lateral (a app em si)
│   │   ├── layout.tsx                # AppShell = <Sidebar/> + <TopBar/> + <main/>
│   │   ├── inicio/page.tsx           # Ecrã 4  — Meu Caderno da Terra
│   │   ├── clima/page.tsx            # Ecrã 6  — Previsão do Tempo   (NASA POWER)
│   │   ├── terra/page.tsx            # Ecrã 7  — Minha Terra e Horta (NASA SMAP)
│   │   ├── plantas/page.tsx          # Ecrã 8  — Minhas Plantas
│   │   ├── rotacao/page.tsx          # Ecrã 5  — Rotação de Culturas (SIMULADOR)
│   │   ├── plantio/page.tsx          # Ecrã 10 — Calendário de Plantio
│   │   ├── contas/page.tsx           # Ecrã 9  — Meu Caderninho de Contas
│   │   ├── agronoma/page.tsx         # Ecrã 11 — Falar com a Agrónoma (WhatsApp)
│   │   └── ajuda/page.tsx            # Ecrã 12 — Ouvir Ajuda (áudio)
│   │
│   └── api/
│       └── nasa/
│           ├── power/route.ts        # Proxy + cache 24h para NASA POWER  ← TECH LEAD
│           ├── smap/route.ts         # Humidade do solo (SMAP)            ← TECH LEAD
│           └── ecoStress/route.ts    # Stresse térmico (ECOSTRESS)       ← TECH LEAD
│
├── components/
│   ├── layout/                       # Estrutura da aplicação
│   │   ├── Brand.tsx                 # Logo + "S.O.L.O. / Campo Amigo"
│   │   ├── AuthTopBar.tsx            # Top Bar dos ecrãs de auth (sem sidebar)
│   │   ├── Sidebar.tsx               # Barra lateral (component do design)
│   │   ├── TopBar.tsx                # Cabeçalho com título + "Ouvir Ajuda"
│   │   └── AppShell.tsx              # Junta Sidebar + TopBar + conteúdo
│   │
│   ├── ui/                           # Blocos reutilizáveis (SEM lógica de negócio)
│   │   ├── Button.tsx                # Alturas: sm 40px | md 56px | lg 64px
│   │   ├── Card.tsx                  # Variantes: default | soft
│   │   ├── Field.tsx                 # Label + Input + Texto de ajuda
│   │   ├── Input.tsx                 # Campo de texto 64px
│   │   ├── CodeInputs.tsx            # Os 6 quadradinhos do código SMS
│   │   ├── Callout.tsx               # Aviso | boa notícia | ajuda humana
│   │   └── PhoneNotice.tsx           # "Mensagem enviada para +244 ..."
│   │
│   ├── charts/                       # Gráficos (Recharts)
│   │   ├── WaterBalanceChart.tsx     # Chuva vs. Evapotranspiração
│   │   ├── TemperatureChart.tsx      # Máx/mín + radiação
│   │   └── ChartTooltip.tsx
│   │
│   └── features/                     # Componentes por domínio
│       ├── auth/                     # Ecrãs 1, 1B, 2 e 3
│       │   ├── AuthHero.tsx          # Ícone + título + frase de ajuda
│       │   └── StepRow.tsx           # Passo numerado do guia "passo a passo"
│       ├── dashboard/                # Ecrã 4
│       │   ├── WeatherCard.tsx
│       │   ├── GardenCard.tsx
│       │   ├── TipsGrid.tsx
│       │   └── QuickActions.tsx
│       ├── clima/                    # Ecrã 6
│       │   ├── TodaySummary.tsx
│       │   ├── WeekForecast.tsx
│       │   └── NasaAlerts.tsx
│       ├── terra/                    # Ecrã 7
│       │   ├── SoilGauge.tsx
│       │   ├── PlotCard.tsx
│       │   └── SoilActions.tsx
│       ├── plantas/                  # Ecrã 8
│       │   ├── PlantRow.tsx
│       │   └── HarvestCard.tsx
│       ├── rotacao/                  # Ecrã 5 (core)
│       │   ├── PriorityPicker.tsx    # 4 cartões grandes
│       │   ├── CycleCard.tsx         # 3 cartões de ciclo
│       │   ├── RotationScoreboard.tsx
│       │   └── RotationAdvice.tsx
│       ├── plantio/                  # Ecrã 10
│       │   ├── MonthCard.tsx
│       │   └── TaskList.tsx
│       ├── contas/                   # Ecrã 9
│       │   ├── MoneySummary.tsx
│       │   └── TransactionRow.tsx
│       ├── agronoma/                 # Ecrã 11
│       │   ├── ChatBubble.tsx
│       │   └── QuickQuestions.tsx
│       └── ajuda/                    # Ecrã 12
│           ├── AudioPlayer.tsx
│           ├── ListenSection.tsx
│           └── SpeechPreferences.tsx
│
├── hooks/
│   ├── useNasaAgro.ts                # Consome /api/nasa/power  ← TECH LEAD
│   ├── useSimulator.ts               # Motor de scores da rotação ← TECH LEAD
│   ├── useFarmProfile.ts             # Estado do perfil (localStorage)
│   ├── useSpeech.ts                  # Text-to-Speech (áudio) ← TECH LEAD
│   └── useOffline.ts                 # Cache local para uso sem rede
│
├── lib/
│   ├── nasa/
│   │   ├── client.ts                 # fetch + cache 24h + URL da NASA POWER
│   │   └── normalize.ts              # Converte a resposta crua em AgroSummary
│   ├── agronomia.ts                  # Fórmulas de balanço hídrico, ET0, GDD
│   ├── scores.ts                     # Pesos por prioridade do produtor
│   ├── format.ts                     # Datas, moeda (Kz), números em pt-Angola
│   └── utils.ts                      # cn() — merge de classes Tailwind
│
├── types/
│   ├── agronomy.ts                   # Culturas, solos, biomas, prioridades
│   ├── nasa.ts                       # Contratos das respostas NASA
│   └── ui.ts                         # Props dos componentes de ui/
│
└── data/
    ├── crops.json                    # Matriz agronómica das culturas
    ├── crops.ts                      # crops.json tipado + getCrop()
    ├── biomes.json                   # Chuva de referência por bioma angolano
    └── mock.ts                       # Dados de demonstração (do design .pen)
```

### Mapa: ecrã do design → ficheiro

| Ecrã (`login copy.pen`) | Rota | Componentes principais |
|---|---|---|
| 1. Criar Conta | `/criar-conta` | `ui/Field`, `ui/Input`, `ui/Button`, `ui/Callout` |
| 1-B. Entrar | `/entrar` | `ui/Field`, `ui/Input`, `ui/Button`, `ui/Callout` |
| 2. SMS Enviado | `/sms-enviado` | `ui/Card`, `ui/PhoneNotice`, `features/auth/StepRow` |
| 3. Código de Segurança | `/verificar` | `ui/Card`, `ui/CodeInputs`, `ui/Callout` |
| 4. Meu Caderno da Terra | `/inicio` | `features/dashboard/*` |
| 5. Rotação de Culturas | `/rotacao` | `features/rotacao/*` |
| 6. Previsão do Tempo | `/clima` | `features/clima/*`, `charts/*` |
| 7. Minha Terra e Horta | `/terra` | `features/terra/*` |
| 8. Minhas Plantas | `/plantas` | `features/plantas/*` |
| 9. Meu Caderninho | `/contas` | `features/contas/*` |
| 10. Calendário de Plantio | `/plantio` | `features/plantio/*` |
| 11. Falar com a Agrónoma | `/agronoma` | `features/agronoma/*` |
| 12. Ouvir Ajuda | `/ajuda` | `features/ajuda/*` |

---

## 🧑‍💻 Divisão de tarefas

### 🚀 Tech Lead (dados, lógica, motor)

| # | Tarefa | Onde |
|---|---|---|
| 1 | Proxy + cache 24h da NASA POWER | `src/app/api/nasa/power/route.ts` |
| 2 | Rotas SMAP e ECOSTRESS | `src/app/api/nasa/*/route.ts` |
| 3 | Cliente NASA + normalização de tipos | `src/lib/nasa/` |
| 4 | Hook de consumo da API | `src/hooks/useNasaAgro.ts` |
| 5 | Motor de scores da rotação | `src/hooks/useSimulator.ts` + `src/lib/scores.ts` |
| 6 | Fórmulas agronómicas (ET0, GDD, balanço hídrico) | `src/lib/agronomia.ts` |
| 7 | Leitura em voz alta (Text-to-Speech) | `src/hooks/useSpeech.ts` |
| 8 | Cache offline (localStorage / IndexedDB) | `src/hooks/useOffline.ts` |
| 9 | Tipos e dados agronómicos | `src/types/`, `src/data/` |
| 10 | Build de produção e verificação de tipos | `npm run build` |

### 🎨 Frontend UI Dev (ecrãs e componentes)

| # | Tarefa | Onde |
|---|---|---|
| 1 | Blocos base (`ui/`) | `src/components/ui/` |
| 2 | Estrutura (`Sidebar`, `TopBar`, `AppShell`) | `src/components/layout/` |
| 3 | Ecrãs de autenticação (1, 1B, 2, 3) | `src/app/(auth)/` |
| 4 | Dashboard "Meu Caderno da Terra" (4) | `src/app/(app)/inicio/` |
| 5 | Simulador de Rotação (5) | `src/app/(app)/rotacao/` |
| 6 | Previsão do Tempo (6) | `src/app/(app)/clima/` |
| 7 | Terra e Horta (7) | `src/app/(app)/terra/` |
| 8 | Plantas (8) | `src/app/(app)/plantas/` |
| 9 | Caderninho (9) | `src/app/(app)/contas/` |
| 10 | Calendário de Plantio (10) | `src/app/(app)/plantio/` |
| 11 | Chat com a Agrónoma (11) | `src/app/(app)/agronoma/` |
| 12 | Ouvir Ajuda (12) | `src/app/(app)/ajuda/` |
| 13 | Gráficos | `src/components/charts/` |
| 14 | Responsividade mobile (360px → 4K) | transversal |

> **Estado actual:** ✅ ecrãs **1, 1B, 2 e 3** (autenticação) implementados a partir do
> `login copy.pen`, com os blocos base de `ui/` correspondentes.
> Ver o preview em **`/design-system`** (apenas os blocos usados nestes 4 ecrãs).
> Os restantes ecrãs e o motor de dados NASA continuam por fazer.

---

## 🎨 Regras de design (não negociar)

O público-alvo tem **mais de 60 anos**, usa o telemóvel **ao sol no campo** e por vezes **sem internet**. Daí as regras:

1. **Fonte única:** Atkinson Hyperlegible (já configurada). Sem serifadas, sem fontes condensadas.
2. **Tamanho mínimo de texto: 14px.** Corpo de texto a 16-19px. Títulos a 24-34px. Números grandes a 28-56px.
3. **Alvos de toque ≥ 48px.** Botões principais com 64px de altura.
4. **Contraste alto.** Fundo creme `#FAF6EF`, texto `#1F1B17`. Nunca texto cinza-claro sobre branco.
5. **Sem `<select>` nativo.** Usar `ui/Select` (cards com seta) — é mais fácil de tocar e de ler.
6. **Uma ideia por ecrã.** Cada ecrã responde a UMA pergunta.
7. **"Ouvir Ajuda" sempre visível** no `TopBar` de todas as páginas.
8. **Sem ícones sem rótulo.** Todo o ícone com texto ao lado.
9. **Sem gradientes decorativos, sem sombras pesadas.** Só `border` de 1px e `surface-soft`.

### Tokens

A fonte de verdade é o bloco `@theme` em **`src/app/globals.css`**:

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#FAF6EF` | Fundo da página |
| `surface` | `#FFFFFF` | Cartões |
| `surface-soft` | `#F2ECE1` | Cartões secundários, campos |
| `border` | `#E0D8C8` | Bordas |
| `text-primary` | `#1F1B17` | Títulos |
| `text-secondary` | `#3E4A3D` | Texto corrido |
| `text-muted` | `#6E7B6C` | Texto de apoio |
| `primary` | `#006B2C` | Marca, botões, acção |
| `primary-soft` | `#E3F0E4` | Fundos de destaque e badges |
| `warm` / `warm-text` | `#FFDDB0` / `#281800` | Botão "Ouvir Ajuda" |
| `warning` / `warning-soft` | `#8A5A00` / `#FFF4DC` | Alertas |
| `danger` | `#B3261E` | Erro / risco |

---

## 🔌 Contrato da API NASA

`GET /api/nasa/power?lat=-12.97&lon=-39.51&start=20260101&end=20261231`

Devolve a resposta normalizada da NASA POWER (`T2M`, `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `RH2M`, `ALLSKY_SFC_SW_DWN`). Cache de **24 horas** na edge (`revalidate: 86400`) para poupar dados móveis.

Consultar `src/types/nasa.ts` para os tipos exactos.

---

## 🚀 Comandos

```bash
npm install       # instalar dependências
npm run dev       # servidor de desenvolvimento → http://localhost:3000
npm run build     # build de produção (verifica tipos)
npm run lint      # verificação de tipos (tsc --noEmit)
```

---

## 📚 Documentação

| Ficheiro | Conteúdo |
|---|---|
| **`login copy.pen`** | **Design completo dos 12 ecrãs** (pen.dev) — abrir na extensão Pencil |
| `escopo-projecto.md` | Escopo técnico, objectivos e critérios de avaliação da NASA |
| `stitch-design-system-prompt.md` | Especificação original do design system (9 ecrãs) |
| `index.html` | Protótipo funcional original com simulador e catálogo de APIs |
| `README.md` | Este documento |

---

## ✅ Checklist de acessibilidade (validar em cada ecrã)

- [ ] Texto mínimo 14px, corpo a 16px+
- [ ] Alvos de toque ≥ 48×48px
- [ ] Contraste ≥ 4.5:1 (WCAG AA)
- [ ] Navegação por teclado com anel de foco visível
- [ ] Todas as imagens/ícones têm texto alternativo ou rótulo
- [ ] Funciona com a largura mínima de 360px
- [ ] Título e subtítulo de cada ecrã dizem o que a pessoa vai encontrar
