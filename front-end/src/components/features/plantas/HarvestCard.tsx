"use client";

import React from "react";
import { ShoppingBasket } from "lucide-react";
import { Card } from "@/components/ui/Card";
import horta from "@/data/horta.json";

function formatDate(iso: string): string {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(4, 6));
  const day = Number(iso.slice(6, 8));
  const months = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  return `${day} de ${months[month - 1]}`;
}

/**
 * "Colheitas recentes" — o que a Dona Maria já colheu e onde vendeu.
 */
export function HarvestCard() {
  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
        Colheitas recentes
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {horta.colheitas.map((harvest) => (
          <div
            key={harvest.id}
            className="flex flex-col gap-2 rounded-input bg-surface-soft p-5"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBasket size={20} className="shrink-0 text-primary" aria-hidden />
              <span className="text-base text-text-muted">
                {harvest.soldAt === "feira" ? "Vendido na feira" : "Levado para casa"}
              </span>
            </div>
            <span className="text-lg font-bold text-text-primary">
              {harvest.crop}
            </span>
            <span className="text-2xl font-bold text-primary">
              {harvest.quantity}
            </span>
            <span className="text-sm text-text-muted">
              {formatDate(harvest.date)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
