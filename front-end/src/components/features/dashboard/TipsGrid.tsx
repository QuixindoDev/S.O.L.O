"use client";

import React from "react";
import { Droplets, ShoppingBasket, Sprout } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconBox } from "@/components/ui/IconBox";

export interface Tip {
  title: string;
  description: string;
  badge: string;
  icon: typeof Sprout;
}

export interface TipsGridProps {
  tips?: Tip[];
}

const DEFAULT_TIPS: Tip[] = [
  {
    title: "Tomate Cereja",
    description: "Já estão florindo bastante. Hora de colocar as estacas de madeira.",
    badge: "Pronta para tutorar",
    icon: Sprout,
  },
  {
    title: "Água da Horta",
    description: "Você economizou 4 baldes cheios de água esta semana.",
    badge: "Cuidado exemplar",
    icon: Droplets,
  },
  {
    title: "Próxima Feira Livre",
    description: "Sábado pela manhã na praça da matriz. Leve o que sobrou da horta.",
    badge: "Daqui a 3 dias",
    icon: ShoppingBasket,
  },
];

/** "Dicas & Lembretes de Hoje" — 3 recados curtos e accionáveis. */
export function TipsGrid({ tips = DEFAULT_TIPS }: TipsGridProps) {
  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
            Dicas & Lembretes de Hoje
          </h2>
          <span className="text-base text-text-muted">
            {tips.length} recados para hoje
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <div
              key={tip.title}
              className="flex flex-col gap-2.5 rounded-input bg-surface-soft p-5"
            >
              <IconBox icon={Icon} tone="surface" />
              <h3 className="text-lg font-bold text-text-primary">{tip.title}</h3>
              <p className="text-base leading-relaxed text-text-secondary">
                {tip.description}
              </p>
              <div className="mt-auto pt-1">
                <span className="inline-flex rounded-full bg-surface px-3 py-1.5 text-sm font-bold text-text-secondary">
                  {tip.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
