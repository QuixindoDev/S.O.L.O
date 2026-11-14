"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export interface AppShellProps {
  title: string;
  subtitle?: string;
  location?: string;
  hideHelp?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Estrutura de todas as páginas da aplicação.
 *
 * - Desktop (≥1024px): barra lateral fixa à esquerda + cabeçalho.
 * - Telemóvel (<1024px): a barra vira um drawer aberto pelo botão de menu
 *   (hamburger) que aparece no cabeçalho.
 */
export function AppShell({
  title,
  subtitle,
  location,
  hideHelp,
  children,
  className,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Fecha o menu ao redimensionar para desktop (evita estados presa).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setMenuOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Bloqueia a rolagem do fundo enquanto o drawer está aberto.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Fecha com a tecla Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className={cn("flex h-screen w-full overflow-hidden bg-bg", className)}>
      {/* Barra lateral fixa (desktop) */}
      <Sidebar />

      {/* Drawer (telemóvel) */}
      <div
        aria-hidden={!menuOpen}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMenuOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-out lg:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar isDrawer onClose={() => setMenuOpen(false)} />
      </div>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          subtitle={subtitle}
          location={location}
          hideHelp={hideHelp}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-9 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
