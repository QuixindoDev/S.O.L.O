import { AuthTopBar } from "@/components/layout/AuthTopBar";

/**
 * Layout dos ecrãs de autenticação (1, 1B, 2 e 3).
 * Sem barra lateral: barra superior branca + conteúdo centrado.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-bg">
      <AuthTopBar />
      <div className="h-px w-full shrink-0 bg-border" />
      <main className="flex w-full flex-col items-center px-12 pt-14 pb-18">
        {children}
      </main>
    </div>
  );
}
