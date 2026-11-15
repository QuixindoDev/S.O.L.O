import React from "react";

/**
 * Layout partilhado das páginas da aplicação (grupo de rotas `(app)`).
 *
 * Cada página usa o `AppShell` diretamente porque o título do cabeçalho
 * muda de ecrã para ecrã.
 */
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
