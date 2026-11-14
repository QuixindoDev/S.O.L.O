"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Satellite, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { navGroups } from "./navItems";

export interface SidebarProps {
  /** Sobrescreve a detecção automática do item activo (útil em prévias). */
  activeHref?: string;
  userName?: string;
  farmName?: string;
  userInitials?: string;
  /** Fecha o menu (usado no drawer do telemóvel). */
  onClose?: () => void;
  /** Versão drawer: mostra o botão de fechar e ocupa a largura toda no mobile. */
  isDrawer?: boolean;
}

/**
 * Barra lateral esquerda — navegação principal.
 * Desktop: sempre visível, 280px fixos.
 * Telemóvel: drawer deslizante aberto pelo botão de menu.
 */
export function Sidebar({
  activeHref,
  userName = "Dona Maria",
  farmName = "Sítio Recanto Verde",
  userInitials = "DM",
  onClose,
  isDrawer = false,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-y-auto border-r border-border bg-surface",
        isDrawer
          ? "w-[85vw] max-w-[300px] shadow-2xl"
          : "hidden w-[280px] lg:flex",
      )}
    >
      {/* Marca */}
      <div className="flex shrink-0 items-center gap-3.5 px-6 pt-5 pb-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-input bg-primary">
          <Satellite size={24} className="text-white" aria-hidden />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-[22px] font-bold text-primary">S.O.L.O.</span>
          <span className="text-sm text-text-muted">Campo Amigo</span>
        </div>

        {isDrawer && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft"
          >
            <X size={24} aria-hidden />
          </button>
        )}
      </div>

      <div className="h-px w-full shrink-0 bg-border" />

      {/* Navegação */}
      <nav className="flex min-h-0 flex-1 flex-col gap-4 px-3.5 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <span className="px-2 pt-2 pb-1.5 text-[11px] font-bold tracking-wider text-text-muted">
              {group.label}
            </span>
            {group.items.map((item) => {
              const isActive =
                activeHref !== undefined
                  ? activeHref === item.href
                  : pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-input px-3 py-2.5 text-lg leading-snug transition-colors",
                    isActive
                      ? "bg-primary-soft font-bold text-primary"
                      : "font-normal text-text-secondary hover:bg-surface-soft",
                  )}
                >
                  <Icon size={22} className="shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Fonte de dados */}
      <div className="mt-auto flex shrink-0 items-center gap-2.5 px-6 py-3">
        <Satellite size={18} className="shrink-0 text-text-muted" aria-hidden />
        <span className="text-sm font-bold text-text-muted">Dados da NASA</span>
      </div>

      <div className="h-px w-full shrink-0 bg-border" />

      {/* Perfil */}
      <div className="flex shrink-0 items-center gap-3 px-5 py-3.5">
        <Avatar initials={userInitials} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[17px] font-bold text-text-primary">
            {userName}
          </span>
          <span className="truncate text-sm text-text-muted">{farmName}</span>
        </div>
      </div>

      <button
        type="button"
        className="flex shrink-0 items-center gap-3 px-6 py-3 pb-5 text-left text-base font-bold text-text-muted transition-colors hover:text-danger"
      >
        <LogOut size={20} className="shrink-0" aria-hidden />
        Sair da conta
      </button>
    </aside>
  );
}
