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
   *   www.profile.agrosolo.earth/             →  /inicio        (dashboard)
   *   www.profile.agrosolo.earth/minhas-plantas      →  /minhas-plantas
   *   www.profile.agrosolo.earth/previsao-do-tempo   →  /previsao-do-tempo
   *   www.admin.agrosolo.earth/*              →  /admin/*
   *
   * O subdomínio `profile` serve a MESMA aplicação do domínio principal —
   * por isso só a raiz precisa de rewrite. Todas as outras rotas
   * (`/minhas-plantas`, `/previsao-do-tempo`, …) já existem como páginas
   * e são servidas tal e qual.
   *
   * `beforeFiles` para o rewrite acontecer ANTES da procura de ficheiros:
   * assim o subdomínio tem sempre prioridade.
   */
  async rewrites() {
    return {
      beforeFiles: [
        {
          // A raiz do subdomínio profile abre directamente o dashboard.
          source: "/",
          has: [{ type: "host", value: "www.profile.agrosolo.earth" }],
          destination: "/inicio",
        },
        {
          // Área de administração (para quando o subdomínio ficar pronto).
          source: "/:path*",
          has: [{ type: "host", value: "www.admin.agrosolo.earth" }],
          destination: "/admin/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
