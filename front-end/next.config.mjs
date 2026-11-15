/** @type {import('next').NextConfig} */
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
  },
};

export default nextConfig;
