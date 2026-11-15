"use client";

import React from "react";
import Image from "next/image";
import { ShoppingBasket } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cropImageFor } from "@/lib/cropImage";
import type { HarvestDto } from "@/lib/api/types";

function formatDate(iso: string): string {
  // O back-end devolve 'YYYYMMDD'; acceptamos também 'YYYY-MM-DD'.
  const clean = iso.replace(/-/g, "");
  if (clean.length !== 8 || !/^\d{8}$/.test(clean)) return iso;

  const year = Number(clean.slice(0, 4));
  const month = Number(clean.slice(4, 6));
  const day = Number(clean.slice(6, 8));
  const months = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  const hoje = new Date();
  const mesmoAno = hoje.getFullYear() === year;
  return mesmoAno
    ? `${day} de ${months[month - 1]}`
    : `${day} de ${months[month - 1]} de ${year}`;
}

/**
 * "Colheitas recentes" — o que a Dona Maria já colheu e onde vendeu.
 *
 * Cada colheita é um card com a fotografia da cultura por trás e o
 * texto por cima, para se ler ao sol.
 */
export function HarvestCard({ harvests }: { harvests: HarvestDto[] }) {
  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
        Colheitas recentes
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {harvests.map((harvest) => (
          <div
            key={harvest.id}
            className="relative flex min-h-[200px] flex-col justify-end gap-1 overflow-hidden rounded-input p-5"
          >
            <Image
              src={cropImageFor(harvest.crop)}
              alt={`Foto da colheita ${harvest.crop}`}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/15"
            />

            <div className="relative flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <ShoppingBasket size={20} className="shrink-0 text-white" aria-hidden />
                <span className="text-base text-white/90">
                  {harvest.soldAt === "feira" ? "feira" : "casa"}
                </span>
              </div>
              <span className="text-lg font-bold text-white">{harvest.crop}</span>
              <span className="text-2xl font-bold text-white">{harvest.quantity}</span>
              <span className="text-sm text-white/85">{formatDate(harvest.date)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
