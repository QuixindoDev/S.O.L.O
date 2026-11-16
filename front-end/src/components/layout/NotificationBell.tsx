"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  Info,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api/endpoints";
import { useNotifications } from "@/lib/notifications/useNotifications";
import { listNotifications, notify, type NotificationKind } from "@/lib/notifications/store";

const KIND_STYLES: Record<
  NotificationKind,
  { icon: typeof Bell; tone: string; badge: string; label: string }
> = {
  sucesso: {
    icon: CircleCheck,
    tone: "text-primary",
    badge: "bg-primary-soft text-primary",
    label: "Sucesso",
  },
  erro: {
    icon: CircleAlert,
    tone: "text-danger",
    badge: "bg-danger-soft text-danger",
    label: "Erro",
  },
  info: {
    icon: Info,
    tone: "text-text-secondary",
    badge: "bg-surface-soft text-text-secondary",
    label: "Informação",
  },
};

/** "agora mesmo", "há 5 min", "ontem"… */
function timeLabel(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

/**
 * Sino das notificações.
 *
 * Cada resposta da API — boa ou má — cai aqui. O número no sino diz
 * quantas ainda não foram lidas.
 */
export function NotificationBell() {
  const { items, unread, markAllRead, markRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Verificação de saúde do servidor (silenciosa): se o back-end não
  // responder, a pessoa fica a saber porquê — em vez de ver ecrãs
  // vazios sem explicação.
  useEffect(() => {
    let cancelado = false;

    async function verificarServidor() {
      try {
        await api.health({ silent: true, timeoutMs: 8000, noStore: true });
      } catch (error) {
        if (cancelado) return;

        const mensagem =
          error instanceof Error
            ? error.message
            : "O servidor não está a responder.";

        // Não repetir a mesma mensagem a cada recarregamento.
        const ultima = listNotifications()[0];
        const recente =
          ultima?.kind === "erro" &&
          ultima.title === "O servidor não está a responder" &&
          Date.now() - ultima.createdAt < 60_000;

        if (recente) return;

        notify({
          kind: "erro",
          title: "O servidor não está a responder",
          message: mensagem,
          path: "/health",
        });
      }
    }

    void verificarServidor();

    return () => {
      cancelado = true;
    };
  }, []);

  // Fecha ao clicar fora do sino.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function abrir() {
    setOpen((wasOpen) => {
      if (!wasOpen) markAllRead();
      return !wasOpen;
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={abrir}
        aria-label={
          unread > 0
            ? `Notificações (${unread} por ler)`
            : "Notificações"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "relative flex h-12 w-12 items-center justify-center rounded-full border border-border text-text-primary transition-colors hover:bg-surface-soft",
          open && "bg-surface-soft",
        )}
      >
        <Bell size={22} aria-hidden />

        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-50 flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-[0_24px_60px_-20px_rgba(31,27,23,0.35)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <span className="text-lg font-bold text-text-primary">
              Notificações
            </span>

            {items.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={markAllRead}
                  aria-label="Marcar tudo como lido"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-soft"
                >
                  <CheckCheck size={20} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  aria-label="Limpar notificações"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-soft"
                >
                  <Trash2 size={20} aria-hidden />
                </button>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-base text-text-muted">
              Ainda não há notificações. As respostas do servidor aparecem
              aqui.
            </p>
          ) : (
            <ul className="flex flex-col overflow-y-auto">
              {items.map((item) => {
                const style = KIND_STYLES[item.kind] ?? KIND_STYLES.info;
                const Icon = style.icon;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => markRead(item.id)}
                      className={cn(
                        "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-soft",
                        !item.read && "bg-primary-soft/40",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          style.badge,
                        )}
                      >
                        <Icon size={18} aria-hidden />
                      </span>

                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-base font-bold text-text-primary">
                          {item.title}
                        </span>

                        {item.message && (
                          <span className="text-sm leading-snug text-text-secondary">
                            {item.message}
                          </span>
                        )}

                        <span className="text-xs text-text-muted">
                          {timeLabel(item.createdAt)}
                          {item.status ? ` · HTTP ${item.status}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
