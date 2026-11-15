/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // O indicador de desenvolvimento do Next.js aparece no canto inferior
  // esquerdo e tapa o "Sair da conta" da barra lateral.
  // Desligado — só incomoda durante o desenvolvimento.
  devIndicators: false,

  /**
   * Rewrites por subdomínio.
   *
   * A Vercel lê esta função — num projecto Next.js não é preciso
   * um `vercel.json` separado.
   *
   *   admin.agrosolo.earth/*    →  /admin/*
   *   profile.agrosolo.earth/*  →  /profile/*
   *
   * `beforeFiles` para o rewrite acontecer ANTES da procura de ficheiros:
   * assim o subdomínio tem sempre prioridade e não depende de a rota
   * existir fisicamente para o rewrite ser aplicado.
   *
   * `:path*` captura o caminho completo (incluindo vazio, para a raiz),
   * ao contrário de `/(.)` que só apanha um caractere e perdia o resto.
   */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:path*",
          has: [{ type: "host", value: "admin.agrosolo.earth" }],
          destination: "/admin/:path*",
        },
        {
          source: "/:path*",
          has: [{ type: "host", value: "profile.agrosolo.earth" }],
          destination: "/profile/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
