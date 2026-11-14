# 🛰️ S.O.L.O. — Campo Amigo

> **NASA International Space Apps Challenge 2026**
> Desafio: *Field Shift: Adapting Farms with NASA Data*
> Repositório: `QuixindoDev/S.O.L.O` · Branch: `requisitos`

Plataforma de suporte à decisão para **agricultura familiar**, que traduz dados de satélite da NASA em conselhos simples e visuais para quem tem mais de 60 anos e cultiva a terra.

---

## 📁 Organização do repositório

O projecto está dividido em **monorepo** — cada equipa trabalha na sua pasta, sem conflitos de ficheiros.

```text
S.O.L.O/
├── front-end/          # ⬅️ Next.js 15 · React · TypeScript · Tailwind CSS
│   ├── src/            #   aplicação (rotas, componentes, hooks, lib, tipos)
│   ├── public/
│   ├── login.pen       #   🎨 DESIGN COMPLETO das 12 telas (pen.dev)
│   ├── index.html      #   protótipo funcional original
│   ├── package.json
│   └── README.md       #   📖 arquitectura de pastas + divisão de tarefas
│
└── back-end/           # ⬅️ API de dados da NASA (a criar pelo colega)
    ├── src/
    ├── package.json
    └── README.md
```

**Regra da equipa:** cada pasta é território de uma equipa. **Não mexer** em `front-end/` e `back-end/` ao mesmo tempo sem avisar no grupo.

---

## 👥 Equipa

| Pasta | Equipa | Responsabilidade |
|---|---|---|
| `front-end/` | 🎨 Frontend UI Dev + 🚀 Tech Lead | Interface Next.js, components, integração da API |
| `back-end/` | 👨‍💻 Back-end Dev | Endpoints, proxy/cache da NASA POWER, SMAP, ECOSTRESS |

---

## 🚀 Frontend — arranque rápido

```bash
cd front-end
npm install
npm run dev     # → http://localhost:3000
```

📖 **A documentação completa do frontend está em [`front-end/README.md`](./front-end/README.md)** — contém:

- Árvore de pastas completa (onde meter cada ficheiro)
- Mapa de cada ecrã do design → rota → componente
- Divisão de tarefas detalhada (10 para Tech Lead, 14 para Frontend UI Dev)
- Tokens do design e as 9 regras inegociáveis de acessibilidade
- Contrato da API NASA

---

## 🎨 Design

O design completo das **12 telas** está em **`front-end/login.pen`** (ferramenta pen.dev / Pencil).

> ⚠️ **Não abrir nem editar o `.pen` com um editor de texto normal.**
> O ficheiro é encriptado — só a extensão Pencil / MCP do pen.dev o pode abrir e alterar.

| Ecrã | Ecrã |
|---|---|
| 1. Criar Conta | 2. SMS Enviado |
| 1-B. Entrar | 3. Código de Segurança (2FA) |
| 4. Meu Caderno da Terra (Início) | 5. Rotação de Culturas (Simulador NASA) |
| 6. Previsão do Tempo (POWER) | 7. Minha Terra e Horta (SMAP) |
| 8. Minhas Plantas | 9. Meu Caderninho de Contas |
| 10. Calendário de Plantio | 11. Falar com a Agrônoma (WhatsApp) |
| 12. Ouvir Ajuda (Áudio) | |

---

## 📡 Fontes de dados da NASA

| Fonte | Parâmetros | Uso no projecto |
|---|---|---|
| **NASA POWER** | `T2M`, `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `RH2M`, `ALLSKY_SFC_SW_DWN` | Balanço hídrico, ET0, previsão de semeadura |
| **NASA SMAP** | Umidade superficial (0-5 cm) e zona radicular (0-100 cm) | Diagnóstico de reserva de água do solo |
| **NASA ECOSTRESS** | `ETa`, `ESI`, `WUE` | Alerta precoce de estresse térmico na copa |
| **GPM IMERG / MODIS** | Precipitação, `NDVI`, `NDWI` | Anomalias de chuva e vigor vegetativo |

Todas as APIs são **REST públicas e gratuitas**, sem API key.

---

## 📚 Documentação

| Ficheiro | Conteúdo |
|---|---|
| [`front-end/README.md`](./front-end/README.md) | **Arquitectura de pastas, mapa ecrã→código, divisão de tarefas** |
| `front-end/login.pen` | Design das 12 telas (pen.dev) |
| `front-end/escopo-projecto.md` | Escopo técnico e critérios de avaliação da NASA |
| `front-end/stitch-design-system-prompt.md` | Especificação original do design system |
| `front-end/index.html` | Protótipo funcional com simulador e catálogo de APIs |

---

## 🌐 Caso de uso em foco

> Dona Maria, 68 anos, cultiva uma horta em Feira de Santana - BA.
> Abre a app no telemóvel, ao sol, e o S.O.L.O. diz-lhe **em português simples**:
> *"Hoje é um ótimo dia para cuidar da horta. O solo está bem úmido. Não precisa regar."*

É esse o teste de todas as decisões de design: **se a Dona Maria não entende, a gente refaz.**
