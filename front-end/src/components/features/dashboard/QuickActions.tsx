"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconBox } from "@/components/ui/IconBox";

export interface QuickAction {
  title: string;
  description: string;
  icon: typeof Wallet;
  href: string;
}

export interface QuickActionsProps {
  actions?: QuickAction[];
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    title: "Previsão da Semana",
    description: "Sol, chuva e melhores dias de plantio",
    icon: CalendarDays,
    href: "/clima",
  },
  {
    title: "Meu Caderninho de Contas",
    description: "Vendas na feira e gastos com adubo",
    icon: Wallet,
    href: "/contas",
  },
  {
    title: "Falar com a Agrônoma",
    description: "Tirar dúvida rápida no WhatsApp",
    icon: MessageCircle,
    href: "/agronoma",
  },
];

/** "O que você quer ver agora?" — atalhos para as tarefas mais comuns. */
export function QuickActions({ actions = DEFAULT_ACTIONS }: QuickActionsProps) {
  const router = useRouter();

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
        O que você quer ver agora?
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              type="button"
              onClick={() => router.push(action.href)}
              className="flex flex-col gap-2.5 rounded-input bg-surface-soft p-5 text-left transition-colors hover:bg-primary-soft"
            >
              <IconBox icon={Icon} tone="surface" />
              <span className="text-lg font-bold text-text-primary">
                {action.title}
              </span>
              <span className="text-base leading-snug text-text-secondary">
                {action.description}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
