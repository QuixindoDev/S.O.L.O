"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Menu, Volume2 } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TopBarProps {
  title: string;
  subtitle?: string;
  /** Mostra o botão de localização (com coordenadas da fazenda). */
  location?: string;
  /** Esconde o botão "Ouvir Ajuda" (ex.: na própria página de ajuda). */
  hideHelp?: boolean;
  /** Abre o menu lateral no telemóvel. */
  onOpenMenu?: () => void;
  className?: string;
}

/**
 * Cabeçalho da aplicação: título da página, localização e "Ouvir Ajuda".
 * O botão de áudio está sempre presente — é a via de escape de quem
 * não consegue ler o ecrã com conforto.
 */
export function TopBar({
  title,
  subtitle,
  location,
  hideHelp = false,
  onOpenMenu,
  className,
}: TopBarProps) {
  return (
    <header
      className={cn(
        "flex h-[76px] shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6 lg:h-[88px] lg:px-9",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Abrir menu"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-input border border-border text-text-primary transition-colors hover:bg-surface-soft lg:hidden"
          >
            <Menu size={24} aria-hidden />
          </button>
        )}

        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-xl font-bold text-text-primary sm:text-2xl lg:text-[26px]">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-sm text-text-muted sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {location && (
          <div className="hidden items-center gap-2.5 rounded-full bg-surface-soft px-4 py-2.5 md:flex">
            <MapPin size={20} className="shrink-0 text-primary" aria-hidden />
            <span className="text-base font-bold text-text-primary">
              {location}
            </span>
          </div>
        )}

        {!hideHelp && (
          <Link
            href="/ouvir-ajuda"
            aria-label="Ouvir Ajuda"
            className="flex h-12 items-center gap-2 rounded-full bg-warm px-3.5 transition-opacity hover:opacity-90 sm:px-5"
          >
            <Volume2 size={22} className="shrink-0 text-warm-text" aria-hidden />
            <span className="hidden text-[17px] font-bold text-warm-text sm:inline">
              Ouvir Ajuda
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
