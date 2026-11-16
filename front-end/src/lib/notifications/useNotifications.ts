"use client";

import { useSyncExternalStore } from "react";
import {
  clearAll,
  getSnapshot,
  markAllRead,
  markRead,
  subscribe,
  type AppNotification,
} from "./store";

export interface UseNotifications {
  items: AppNotification[];
  unread: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

/**
 * Hook das notificações.
 *
 * `useSyncExternalStore` garante que o sino se actualiza sempre que
 * chega uma resposta nova da API, sem polling nem re-renderizações
 * a mais.
 */
export function useNotifications(): UseNotifications {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    items,
    unread: items.filter((n) => !n.read).length,
    markAllRead,
    markRead,
    clearAll,
  };
}
