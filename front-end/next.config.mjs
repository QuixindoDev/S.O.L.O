/** @type {import('next').NextConfig} */
import fs from "node:fs";
import path from "node:path";

/**
 * Ficheiros que NÃO podem ser reescritos pelo wildcard do subdomínio
 * `admin`.
 *
 * O wildcard `/admin/:path*` é muito abrangente: apanha também os
 * assets do Next (`/_next/static/chunks/*.css`) e as imagens da pasta
 * `public/` — que devolviam 404 e deixavam a página sem estilos.
 *
 * Construímos a lista de excepções a partir do que existe em
 * `public/`, para não ter de a manter à mão.
 */
function nomesDosAssetsPublicos() {
  const pasta = path.join(process.cwd(), "public");

  try {
    return fs
      .readdirSync(pasta, { withFileTypes: true })
      .filter((entrada) => entrada.isFile())
      .map((entrada) => entrada.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  } catch {
    return [];
  }
}

const nextConfig = {
  reactStrictMode: true,
  // O indicador de desenvolvimento do Next.js aparece no canto inferior
  // esquerdo e tapa o "Sair da conta" da barra lateral.
  // Desligado — só incomoda durante o desenvolvimento.
  devIndicators: false,

  /**
   * Subdomínios (Vercel).
   *
   * Num projecto Next.js a Vercel lê esta função — não é preciso
   * um `vercel.json` separado.
   *
   *   www.agrosolo.earth/                    →  /              (app principal)
   *   profile.agrosolo.earth/                →  /inicio        (dashboard)
   *   profile.agrosolo.earth/minhas-plantas →  /minhas-plantas
   *   admin.agrosolo.earth/*                 →  /admin/*
   *
   * O subdomínio `profile` serve a MESMA aplicação do domínio principal —
   * por isso só a raiz precisa de rewrite. Todas as outras rotas
   * (`/minhas-plantas`, `/previsao-do-tempo`, …) já existem como páginas
   * e são servidas tal e qual.
   *
   * ⚠️ Cada subdomínio é aceite **com e sem** `www.` — na Vercel os dois
   * domínios têm de estar ligados ao mesmo deployment, senão um deles
   * fica a servir a homepage em vez da app.
   *
   * `beforeFiles` para o rewrite acontecer ANTES da procura de ficheiros:
   * assim o subdomínio tem sempre prioridade.
   */
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

    /**
     * Caminhos que o wildcard do subdomínio `admin` não pode apanhar:
     * os assets do Next e os ficheiros da pasta `public/`.
     */
    const exclusoes = ["_next", ...nomesDosAssetsPublicos()];
    const naoReescrever = `:path((?!${exclusoes.join("|")}).*)`;

    const adminRules = hostsOf("admin").map((host) => ({
      // ⚠️ O caminho NÃO pode começar por `_next` nem por nenhum
      // ficheiro de `public/`.
      //
      // Com `source: "/:path*"` o wildcard apanhava também os assets
      // do Next (`/_next/static/chunks/*.css`), reescrevendo-os para
      // `/admin/_next/...` — que devolvia 404. O HTML da página
      // carregava, mas o CSS não: a página ficava sem estilos.
      source: `/${naoReescrever}`,
      has: [{ type: "host", value: host }],
      destination: "/admin/:path*",
    }));

    return {
      beforeFiles: [...profileRules, ...adminRules],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
