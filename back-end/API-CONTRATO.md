# 🔌 Contrato da API — S.O.L.O. Campo Amigo

> Documento de **interface** entre o front-end (`../front-end/`) e o back-end.
> O `README.md` desta pasta é do colega que constrói o servidor — este ficheiro
> define apenas o formato que o front-end **já consome**.

---

## 🎯 Missão do back-end

O objectivo **não** é inventar dados. É:

1. **Buscar** os dados reais da NASA (POWER, SMAP, ECOSTRESS, GPM).
2. **Normalizar** para um formato único e fácil de consumir pelo front-end.
3. **Proteger** o front-end de CORS, de limites de taxa e de quedas da NASA.
4. **Cachear** para que a Dona Maria não gaste o dados móveis dela.

---

## 🔌 Contrato da API (o que o front-end espera)

> ✅ **Implementado.** O proxy `../front-end/src/app/api/nasa/power/route.ts`
> já aponta para este back-end, e a forma de resposta é a mesma — a
> integração é plug-and-play.

### `GET /api/nasa/power`

| Parâmetro | Obrigatório | Default | Descrição |
|---|---|---|---|
| `lat` | não | `-12.97` | Latitude (decimal, com ponto) |
| `lon` | não | `-39.51` | Longitude (decimal, com ponto) |
| `start` | não | `20260101` | Início (AAAA-MM-DD ou AAAAMMDD) |
| `end` | não | `20261231` | Fim (AAAA-MM-DD ou AAAAMMDD) |

**Exemplo:**
```bash
curl "http://localhost:3001/api/nasa/power?lat=-12.97&lon=-39.51&start=20260101&end=20261231"
```

**Resposta (200)** — mesmo formato do proxy actual do front-end:
```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [-39.51, -12.97, 312.0] },
  "properties": {
    "parameter": {
      "T2M":               { "20260101": 28.07 },
      "T2M_MAX":           { "20260101": 36.01 },
      "T2M_MIN":           { "20260101": 21.9 },
      "PRECTOTCORR":       { "20260101": 0.0 },
      "RH2M":              { "20260101": 71.5 },
      "ALLSKY_SFC_SW_DWN": { "20260101": 18.9 }
    }
  },
  "header": { "title": "...", "start": "20260101", "end": "20261231" },
  "messages": []
}
```

Os **tipos TypeScript exactos** estão em [`../front-end/src/types/nasa.ts`](../front-end/src/types/nasa.ts) — usar como referência para não haver divergências.

**Erros:**
| Código | Quando |
|---|---|
| `400` | `lat`/`lon` fora do intervalo válido (-90..90 / -180..180) |
| `502` | A NASA POWER está indisponível ou devolveu erro |
| `500` | Erro interno do proxy |

---

## 🛰️ Endpoints NASA

| Endpoint | Missão NASA | Estado |
|---|---|---|
| `GET /api/nasa/power` | NASA POWER (Agroclimatology) | ✅ Implementado (cache 24 h) |
| `GET /api/nasa/smap` | Umidade do solo (superficial + zona radicular) | ✅ Implementado (GWETTOP / GWETROOT) |
| `GET /api/nasa/ecostress` | ETa, ESI, WUE (estresse térmico) | ⏳ Falta credencial NASA Earthdata (`ECOSTRESS_TOKEN`) — devolve 501 |
| `GET /api/nasa/gpm` | Precipitação IMERG quase em tempo real | ⏳ Falta credencial NASA Earthdata (`EARTHDATA_TOKEN`) — devolve 501 |

---

## ⚙️ Requisitos técnicos

- **Node.js 20+** e TypeScript.
- **Cache com TTL de 24h** por coordenada (a NASA POWER actualiza o histórico, não o futuro — para previsões usar os endpoints de forecast).
- **Sem API key** — todas as missões da NASA usadas são públicas e gratuitas.
- **Timeouts e retries** — a API da NASA às vezes demora 10-20s em séries longas.
- **Normalizar unidades** (°C, mm, MJ/m²) e devolver sempre o mesmo formato, mesmo que a NASA mude o nome de um parâmetro.
- **Devolver `lat`/`lon`/`elevation`/`source`/`generatedAt`** em cada resposta, para o front-end mostrar a origem do dado ao utilizador.

---

## 📂 Estrutura sugerida

```text
back-end/
├── src/
│   ├── server.ts              # bootstrap (Express / Fastify / Hono)
│   ├── routes/
│   │   ├── nasa.ts            # /api/nasa/*
│   │   └── health.ts
│   ├── services/
│   │   ├── nasaPower.ts       # busca + normalização POWER
│   │   ├── nasaSmapp.ts       # SMAP
│   │   └── nasaEcoStress.ts   # ECOSTRESS
│   ├── lib/
│   │   ├── cache.ts           # TTL em memória / Redis
│   │   └── http.ts            # fetch com timeout + retry
│   └── types/                 # espelha ../front-end/src/types/nasa.ts
├── .env.example               # PORT, NASA_API_BASE_URL, CACHE_TTL
├── package.json
└── README.md
```

---

## 🔗 Ligar ao front-end

O front-end já aponta para este back-end. A configuração está em
`../front-end/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

E a camada de acesso do front-end é `../front-end/src/lib/api/`
(`config.ts` com o mapa de endpoints, `http.ts` com o `apiFetch()`,
`endpoints.ts` com uma função por endpoint).

---

## 🔌 Endpoints de negócio (consumidos pelos ecrãs)

| Ecrã | Endpoint |
|---|---|
| Perfil (todos os ecrãs) | `GET /api/v1/profile` |
| Minha Terra e Horta | `GET /api/v1/plots` |
| Minhas Plantas | `GET /api/v1/plants`, `GET /api/v1/harvests`, `POST /api/v1/plants`, `POST /api/v1/harvests` |
| Rotação de Culturas | `POST /api/v1/analyze` (ao guardar a rotação) |
| Renda da Terra | `GET /api/v1/analyses`, `GET /api/v1/farmers/{uuid}/analyses` |
| Administração | `GET /api/v1/farmers`, `GET /api/v1/analyses`, `GET /health` |

---

## 📡 Referências NASA

| Fonte | Documentação |
|---|---|
| NASA POWER | https://power.larc.nasa.gov/docs/ |
| NASA SMAP | https://smap.jpl.nasa.gov/ |
| NASA ECOSTRESS | https://ecostress.jpl.nasa.gov/ |
| GPM IMERG | https://gpm.nasa.gov/data/imerg |

---

## ✅ Critérios de aceitação

- [x] `GET /api/nasa/power` devolve dados reais e normalizados
- [x] Cache de 24h verificável (2º pedido não volta a bater na NASA)
- [x] Timeouts e mensagens de erro claras
- [x] Tipos alinhados com `../front-end/src/types/nasa.ts`
- [x] README com exemplos de `curl` para cada endpoint
