# 🛰️ S.O.L.O. — Campo Amigo

> **NASA International Space Apps Challenge 2026**
> Desafio: *Field Shift: Adapting Farms with NASA Data*
> Repositório: `QuixindoDev/S.O.L.O` · Branch: `requisitos`

Plataforma de suporte à decisão para **agricultura familiar**, que traduz dados de satélite da NASA em conselhos simples e visuais para quem tem mais de 60 anos e cultiva a terra.

> 📍 Esta pasta é a **parte front-end** do projecto. O back-end vive em `../back-end/`.

> 📡 **A integração com as APIs da NASA está documentada em [`../NASA-DADOS.md`](../NASA-DADOS.md)** — que dados usamos, o modelo agronómico do solo, os limites e o que falta implementar.

---

## 📌 Onde meter cada coisa

> **Este é o guia principal para a divisão de tarefas.**
> O design completo das 12 telas está no ficheiro **`pen/login.pen`** (pen.dev). Cada ecrã do design corresponde a **uma pasta/rota** indicada na tabela abaixo.

### 🧩 Componentes já construídos

**`src/components/ui/`** — blocos reutilizáveis (sem lógica de negócio)

| Componente | Variantes / _props | Notas |
|---|---|---|
| `Button` | `primary` · `soft` · `outline` · `ghost` · `sm/md/lg` | Alturas 40/56/64px. `icon` + `iconPosition` + `fullWidth` |
| `IconButton` | `surface` · `soft` · `primary` · `warm` | `label` **obrigatório** (nunca ícone sem rótulo) |
| `Card` | `default` · `soft` · `outline` · `padding` | `rounded-card` (20px) |
| `Badge` | `primary` · `soft` · `warning` · `danger` · `neutral` · `onPrimary` | |
| `IconBox` | `sm/md/lg` × `surface/soft/primary/warm/warning` | Contentor de ícone |
| `Eyebrow` | com/sem ícone | Etiqueta de categoria acima do título |
| `Input` / `Field` | — | `Field` = rótulo + ícone + input + texto de ajuda |
| `Select` | `options[]`, `onChange` | **Substitui o `<select>` nativo** — menu em cartões |
| `ProgressBar` | `value` 0-100, `displayValue` | Barras de sustentabilidade |
| `ScoreRing` | `value`, `label`, `size`, `tone` | Medidor circular SVG |
| `Avatar` | `initials`, `sm/md/lg` | Sem fotos — iniciais |
| `Divider` | — | Linha de 1px |
| `EmptyState` | `icon`, `title`, `description`, `action` | Estado vazio |

**`src/components/layout/`**

| Componente | Descrição |
|---|---|
| `Sidebar` | Barra lateral esquerda. Activo por `usePathname`; `activeHref` para prévias; `isDrawer` + `onClose` para telemóvel |
| `TopBar` | Título + subtítulo + localização + botão "Ouvir Ajuda" + **botão hamburger** (só < 1024px) |
| `AppShell` | Junta Sidebar + TopBar + conteúdo. Gere o estado do drawer (abrir/fechar, Escape, bloqueio de scroll) |
| `navItems` | Definição dos 4 grupos / 9 subsecções do menu |

**`src/lib/cn.ts`** — helper `cn()` (clsx + tailwind-merge).

**`src/lib/nasa/`** — pipeline de dados NASA

| Ficheiro | Responsabilidade |
|---|---|
| `normalize.ts` | Converte a resposta crua da NASA POWER em `AgroSummary` (descarta dias sem medição, `-999`) |
| `client.ts` | `getAgroSummary(lat, lon, dias)` — busca no **servidor** com `revalidate: 86400` e fallback se a NASA falhar |

**`src/lib/farm.ts`** — perfil da fazenda (nome, cidade, coordenadas). Substituir por estado persistido quando o ecrã de cadastro entrar.

**`src/types/nasa.ts`** — inclui `DailyPoint` e `AgroSummary`, o formato normalizado que os ecrãs consomem.

### 🌱 Modelo agronómico do solo

`src/lib/agronomia.ts` implementa um **balanço hídrico** do solo a partir dos
dados reais da NASA POWER:

1. **ETo** — Penman-Monteith (FAO-56, eq. 6) com a radiação solar, o vento
   e a humidade do ar medidos pela NASA. Inclui a radiação extraterrestrial
   calculada para a latitude e o dia do ano (eq. 21).
2. **Balde de 2 camadas** — superficial (5 cm) e zona radicular (30-40 cm),
   com capacidade de campo e ponto de murcha por textura de solo.
3. **Coeficiente de stress hídrico (Ks)** — sem ele a ET não cairia quando o
   solo seca e o modelo colapsaria a 0%. Com ele, o solo estabiliza num
   equilíbrio seco mas realisticamente acima do ponto de murcha.
4. **Humidade final** → % da capacidade de campo → semáforo
   `ideal` (≥60%) / `atencao` (≥35%) / `seco`.

> ⚠️ **Transparência:** isto é uma *estimativa*, não uma medição. A NASA
> **SMAP** dá a humidade do solo medida directamente por satélite — é o
> endpoint `/api/nasa/smap`, ainda por implementar. O balanço **não
> considera a rega** da Dona Maria, por isso pode dizer "seco" num terreno
> que ela acabou de regar. O rodapé do ecrã avisa disto.

### 🖥️ Ecrãs já construídos

| Ecrã | Rota | Ficheiros |
|---|---|---|
| **4. Meu Caderno da Terra (Início)** | `/inicio` | `features/dashboard/{WeatherCard,GardenCard,TipsGrid,QuickActions}.tsx` |
| **6. Previsão do Tempo** | `/previsao-do-tempo` | `features/clima/{TodaySummary,WeekForecast,NasaAlerts}.tsx` |
| **7. Minha Terra e Horta** | `/minha-terra-e-horta` | `features/terra/{SoilStatusCard,PlotsCard,SoilActionsCard}.tsx` |
| **8. Minhas Plantas** | `/minhas-plantas` | `features/plantas/{PlantList,HarvestCard}.tsx` |

Ambas são **Server Components** com `export const revalidate = 86400`:
os dados do satélite são buscados no servidor e **chegam no HTML inicial** —
sem ecrã em branco no 3G rural e sem gastar os dados móveis da Dona Maria.

> ⚠️ **Transparência:** a NASA POWER só tem **histórico**, não previsões.
> Por isso o ecrã diz *"os últimos 7 dias"* e mostra a data da última
> observação, em vez de fingir uma previsão. É um requisito do júri
> (critério *Data Transparency*).

---

### 📱 Responsividade

Todos os componentes são responsivos. Breakpoints usados:

| Largura | Comportamento |
|---|---|
| `< 640px` (mobile) | 1 coluna. Botão "Ouvir Ajuda" vira só ícone. Localização escondida. |
| `640-1023px` (tablet) | 1-2 colunas. Menu hamburger activo. Localização visível a partir de `md`. |
| `≥ 1024px` (desktop) | Barra lateral fixa (280px) + conteúdo em 2-3 colunas. |

**A barra lateral transforma-se em drawer no telemóvel:**

- O botão **☰ (hamburger)** aparece no `TopBar` apenas abaixo de 1024px.
- O drawer desliza da esquerda (300px máx.), com fundo escurecido por cima.
- Fecha ao tocar no fundo, no botão **✕**, ao escolher um item, ou com a tecla **Escape**.
- A rolagem do fundo é bloqueada enquanto o drawer está aberto.

> Para testar: estreita a janela do browser abaixo de 1024px, ou abre no telemóvel.

**Regras para quem construir ecrãs:**

- Usar grelhas `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` — nunca `grid-cols-3` fixo.
- Nunca fixar largura em pixels para conteúdo: usar `w-full`, `min-w-0` e `flex-1`.
- Botões dentro de listas devem ter `fullWidth` no mobile.
- Tabelas e listas longas → `overflow-x-auto` num contentor.

---

### 🚧 Rota temporária de avaliação

> **Rota:** `http://localhost:3000/design-system`
> Ficheiro: `src/app/design-system/page.tsx`
> **É temporária — apagar antes da demonstração final.**

Mostra lado a lado todos os componentes com todas as variantes, para avaliação visual e para servir de referência de estilo ao teu colega.

---

### Árvore de pastas do projecto

```text
src/
├── app/
│   ├── layout.tsx                    # Shell global: fonte Atkinson, metatags, <body>
│   ├── globals.css                   # TOKENS DO DESIGN (fonte de verdade)
│   ├── page.tsx                      # Raiz → redirect para /inicio
│   ├── not-found.tsx                 # Página 404 à marca (substitui a da Vercel)
│   │
│   ├── (auth)/                       # Telas SEM barra lateral (login/cadastro)
│   │   ├── layout.tsx                # Wrapper simples centrado
│   │   ├── criar-conta/page.tsx      # Ecrã 1  — Criar Conta
│   │   ├── entrar/page.tsx           # Ecrã 1B — Entrar
│   │   ├── sms-enviado/page.tsx      # Ecrã 2  — SMS Enviado
│   │   └── verificar/page.tsx        # Ecrã 3  — Código de Segurança (2FA)
│   │
│   ├── (app)/                        # Telas COM barra lateral (a app em si)
│   │   ├── layout.tsx                # AppShell = <Sidebar/> + <TopBar/> + <main/>
│   │   ├── inicio/page.tsx           # Ecrã 4  — Meu Caderno da Terra
│   │   ├── previsao-do-tempo/page.tsx # Ecrã 6 — Previsão do Tempo (NASA POWER)
│   │   ├── minha-terra-e-horta/page.tsx # Ecrã 7 — Minha Terra e Horta (SMAP)
│   │   ├── minhas-plantas/page.tsx    # Ecrã 8  — Minhas Plantas
│   │   ├── rotacao-de-culturas/page.tsx # Ecrã 5 — Rotação de Culturas (SIMULADOR)
│   │   ├── calendario-de-plantio/page.tsx # Ecrã 10 — Calendário de Plantio
│   │   ├── meu-caderninho/page.tsx   # Ecrã 9  — Meu Caderninho de Contas
│   │   ├── falar-com-a-agronoma/page.tsx # Ecrã 11 — WhatsApp com a Agrônoma
│   │   └── ouvir-ajuda/page.tsx      # Ecrã 12 — Ouvir Ajuda (áudio)
│   │
│   └── api/
│       └── nasa/
│           ├── power/route.ts        # Proxy + cache 24h para NASA POWER  ← TECH LEAD
│           ├── smap/route.ts         # Umidade do solo (SMAP)            ← TECH LEAD
│           └── ecoStress/route.ts    # Estresse térmico (ECOSTRESS)       ← TECH LEAD
│
├── components/
│   ├── layout/                       # Estrutura da aplicação
│   │   ├── Sidebar.tsx               # Barra lateral (component do design)
│   │   ├── TopBar.tsx                # Cabeçalho com título + "Ouvir Ajuda"
│   │   └── AppShell.tsx              # Junta Sidebar + TopBar + conteúdo
│   │
│   ├── ui/                           # Blocos reutilizáveis (SEM lógica de negócio)
│   │   ├── Button.tsx                # Alturas: sm 40px | md 56px | lg 64px
│   │   ├── Card.tsx                  # Variantes: default | soft | outline
│   │   ├── Badge.tsx                 # Estados: success | warning | neutral | danger
│   │   ├── Field.tsx                 # Label + Input + Texto de ajuda
│   │   ├── Input.tsx
│   │   ├── Select.tsx                # Substitui o <select> nativo por cards
│   │   ├── IconButton.tsx
│   │   ├── ProgressBar.tsx           # Barras de pontuação
│   │   ├── ScoreRing.tsx             # Medidor circular 0-100%
│   │   └── EmptyState.tsx
│   │
│   ├── charts/                       # Gráficos (Recharts)
│   │   ├── WaterBalanceChart.tsx     # Chuva vs. Evapotranspiração
│   │   ├── TemperatureChart.tsx      # Máx/mín + radiação
│   │   └── ChartTooltip.tsx
│   │
│   └── features/                     # Componentes por domínio
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
│   ├── useSpeech.ts                 # Leitura em voz alta (áudio)
│   ├── useSimulator.ts               # Motor de scores da rotação ← TECH LEAD
│   ├── useFarmProfile.ts             # Estado do perfil (localStorage)
│   └── useOffline.ts                 # Cache local para uso sem rede
│
├── lib/
│   ├── nasa/
│   │   ├── client.ts                 # fetch + cache + normalização POWER
│   │   └── normalize.ts              # Converte a resposta crua em AgroSummary
│   ├── agronomia.ts                  # Balanço hídrico do solo (FAO-56)
│   ├── scores.ts                     # Pesos por prioridade do produtor
│   └── format.ts                     # Datas, moeda, números em pt-BR
│
├── types/
│   ├── agronomy.ts                   # Culturas, solos, biomas, prioridades
│   ├── nasa.ts                       # Contratos das respostas NASA
│   └── ui.ts                         # Props dos componentes de ui/
│
└── data/
    ├── crops.json                    # Matriz agronómica das culturas
    └── biomes.json                   # Chuva de referência por bioma
```

### Mapa: ecrã do design → ficheiro

| Ecrã (`pen/login.pen`) | Rota | Componentes principais |
|---|---|---|
| 1. Criar Conta | `/criar-conta` | `ui/Field`, `ui/Button` |
| 1-B. Entrar | `/entrar` | `ui/Field`, `ui/Button` |
| 2. SMS Enviado | `/sms-enviado` | `ui/Card`, `ui/Badge` |
| 3. Código de Segurança | `/verificar` | `ui/Card`, `CodeInputs` |
| 4. Meu Caderno da Terra | `/inicio` | `features/dashboard/*` |
| 5. Rotação de Culturas | `/rotacao-de-culturas` | `features/rotacao/*` |
| 6. Previsão do Tempo | `/previsao-do-tempo` | `features/clima/*`, `charts/*` |
| 7. Minha Terra e Horta | `/minha-terra-e-horta` | `features/terra/*` ✅ |
| 8. Minhas Plantas | `/minhas-plantas` | `features/plantas/*` ✅ |
| 9. Meu Caderninho | `/meu-caderninho` | `features/contas/*` |
| 10. Calendário de Plantio | `/calendario-de-plantio` | `features/plantio/*` |
| 11. Falar com a Agrônoma | `/falar-com-a-agronoma` | `features/agronoma/*` |
| 12. Ouvir Ajuda | `/ouvir-ajuda` | `features/ajuda/*` |

---

## 🧑‍💻 Divisão de tarefas

> ⚠️ **Nota sobre a API.** O proxy `src/app/api/nasa/power/route.ts` já existe e funciona (com cache de 24h na edge).
> Assim que o colega entregar o `back-end/`, este handler passa a fazer **proxy para `http://localhost:PORT/api/nasa/power`** — ou pode ser removido em favour do URL público do back-end.
> Combinem o contrato antes de mexer: ver **Contrato da API NASA** mais abaixo.

### 🚀 Tech Lead (dados, lógica, motor)

| # | Tarefa | Onde |
|---|---|---|
| 1 | Ligar o proxy ao back-end do colega | `src/app/api/nasa/power/route.ts` |
| 2 | Rotas SMAP e ECOSTRESS | `src/app/api/nasa/*/route.ts` |
| 3 | Cliente NASA + normalização de tipos | `src/lib/nasa/` |
| 4 | Cliente NASA + normalização | `src/lib/nasa/client.ts` + `normalize.ts` |
| 5 | Motor de scores da rotação | `src/hooks/useSimulator.ts` + `src/lib/scores.ts` |
| 6 | Fórmulas agronómicas (ETo, balanço hídrico, Ks) | `src/lib/agronomia.ts` |
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
| 5 | Simulador de Rotação (5) | `src/app/(app)/rotacao-de-culturas/` |
| 6 | Previsão do Tempo (6) | `src/app/(app)/previsao-do-tempo/` |
| 7 | Terra e Horta (7) | `src/app/(app)/minha-terra-e-horta/` ✅ |
| 8 | Plantas (8) | `src/app/(app)/minhas-plantas/` ✅ |
| 9 | Caderninho (9) | `src/app/(app)/meu-caderninho/` |
| 10 | Calendário de Plantio (10) | `src/app/(app)/calendario-de-plantio/` |
| 11 | Chat com a Agrônoma (11) | `src/app/(app)/falar-com-a-agronoma/` |
| 12 | Ouvir Ajuda (12) | `src/app/(app)/ouvir-ajuda/` |
| 13 | Gráficos | `src/components/charts/` |
| 14 | Responsividade mobile (360px → 4K) | transversal |

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

## 🌐 Domínios e subdomínios (Vercel)

Num projecto Next.js, a Vercel lê os rewrites da função `rewrites()` em
`next.config.mjs` — **não é preciso um `vercel.json` separado**.

| URL | Rota interna | Ecrã |
|---|---|---|
| `https://www.agrosolo.earth/` | `/` → `/inicio` | App principal do agricultor |
| `https://profile.agrosolo.earth/` | `/` → `/inicio` | Dashboard do agricultor |
| `https://profile.agrosolo.earth/minhas-plantas` | `/minhas-plantas` | Minhas Plantas |
| `https://profile.agrosolo.earth/previsao-do-tempo` | `/previsao-do-tempo` | Previsão do Tempo |
| `https://admin.agrosolo.earth/*` | `/admin/*` | Área de administração |

> ⚠️ **Cada subdomínio é aceite com E SEM `www.`** — ambos estão
> configurados. Na Vercel, os **dois** domínios têm de estar ligados
> ao mesmo deployment (Settings → Domains → Add Domain), senão um deles
> fica a servir a homepage em vez da app.

```js
// next.config.mjs
async rewrites() {
  const AGRO = "agrosolo.earth";

  /** Aceita o subdomínio com e sem o prefixo `www.`. */
  const hostsOf = (sub) => [`${sub}.${AGRO}`, `www.${sub}.${AGRO}`];

  const profileRules = hostsOf("profile").map((host) => ({
    // A raiz do subdomínio profile abre directamente o dashboard.
    source: "/",
    has: [{ type: "host", value: host }],
    destination: "/inicio",
  }));

  const adminRules = hostsOf("admin").map((host) => ({
    source: "/:path*",
    has: [{ type: "host", value: host }],
    destination: "/admin/:path*",
  }));

  return {
    beforeFiles: [...profileRules, ...adminRules],
    afterFiles: [],
    fallback: [],
  };
}
```

**Como funciona:**

- O subdomínio `profile` serve **a mesma aplicação** do domínio principal.
  Só a **raiz** precisa de rewrite (para cair em `/inicio`); todas as
  outras rotas já existem como páginas e são servidas tal e qual.
- A raiz do domínio principal (`/`) **redirecciona** para `/inicio`
  (ver `src/app/page.tsx`) — a Dona Maria nunca vê um ecrã de escolha.
- **As rotas da app são slugs em português** — é o que a Dona Maria lê
  no ecrã do telemóvel e o que aparece no URL.
- `beforeFiles` → o rewrite é aplicado *antes* da procura de ficheiros,
  por isso o subdomínio tem sempre prioridade.
- **Testar localmente** com o header `Host`:
  ```bash
  curl -H "Host: profile.agrosolo.earth" http://localhost:3000/
  ```

### Rotas da aplicação

| Slug (URL) | Ecrã | Estado |
|---|---|---|
| `/inicio` | 4. Meu Caderno da Terra | ✅ |
| `/previsao-do-tempo` | 6. Previsão do Tempo (NASA POWER) | ✅ |
| `/minha-terra-e-horta` | 7. Minha Terra e Horta (SMAP) | ✅ |
| `/minhas-plantas` | 8. Minhas Plantas | ✅ |
| `/rotacao-de-culturas` | 5. Rotação de Culturas (Simulador) | ⬜ |
| `/calendario-de-plantio` | 10. Calendário de Plantio | ⬜ |
| `/meu-caderninho` | 9. Meu Caderninho de Contas | ⬜ |
| `/falar-com-a-agronoma` | 11. Falar com a Agrônoma | ⬜ |
| `/ouvir-ajuda` | 12. Ouvir Ajuda | ⬜ |

> As pastas das rotas por criar já existem em `src/app/(app)/` com o
> nome do slug — basta criar o `page.tsx` dentro.

---

## 🔌 Contrato da API NASA

`GET /api/nasa/power?lat=-12.97&lon=-39.51&start=20260101&end=20261231`

Devolve a resposta normalizada da NASA POWER (`T2M`, `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `RH2M`, `ALLSKY_SFC_SW_DWN`). Cache de **24 horas** na edge (`revalidate: 86400`) para poupar dados móveis.

Consultar `src/types/nasa.ts` para os tipos exactos.

---

## 🚀 Comandos

```bash
# a partir da raiz do repositório
cd front-end

npm install        # instalar dependências
npm run dev        # servidor de desenvolvimento → http://localhost:3000
npm run build      # build de produção (verifica tipos)
npm run lint       # verificação de tipos (tsc --noEmit)
```

---

## 📚 Documentação

| Ficheiro | Conteúdo |
|---|---|
| **`pen/login.pen`** | **Design completo das 12 telas** (pen.dev) — abrir na extensão Pencil |
| `escopo-projecto.md` | Escopo técnico, objectivos e critérios de avaliação da NASA |
| `stitch-design-system-prompt.md` | Especificação original do design system (9 ecrãs) |
| `index.html` | Protótipo funcional original com simulador e catálogo de APIs |
| `AGENTS.md` | Regras geradas automaticamente pelo Next.js 16 para agentes de IA |
| `README.md` | Este documento |
| `../NASA-DADOS.md` | **Guia técnico da integração com as APIs da NASA** (partilhado com o back-end) |

---

## ✅ Checklist de acessibilidade (validar em cada ecrã)

- [ ] Texto mínimo 14px, corpo a 16px+
- [ ] Alvos de toque ≥ 48×48px
- [ ] Contraste ≥ 4.5:1 (WCAG AA)
- [ ] Navegação por teclado com anel de foco visível
- [ ] Todas as imagens/ícones têm texto alternativo ou rótulo
- [ ] Funciona com a largura mínima de 360px
- [ ] Título e subtítulo de cada ecrã dizem o que a pessoa vai encontrar
