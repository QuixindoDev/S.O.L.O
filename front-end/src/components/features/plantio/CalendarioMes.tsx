"use client";

import React from "react";
import { Droplets, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  cropById,
  cropColor,
  monthsShortPeriod,
  MONTHS_LONG,
  type Planting,
  type PlantingBalance,
} from "@/lib/plantio";

export interface CalendarioMesProps {
  /** Mês escolhido (0-11). */
  month: number;
  /** Plantios do calendário. */
  plantings: Planting[];
  /** Balanço hídrico de cada plantio. */
  balances: PlantingBalance[];
  /** Chuva do mês, medida pela NASA (mm). */
  rainMm: number;
  /** Se o mês escolhido é o mês corrente. */
  isCurrentMonth: boolean;
}

/**
 * "Este mês na tua terra" — o que está a acontecer no mês escolhido:
 * que cultura está no chão, quanto choveu e o que falta.
 */
export function CalendarioMes({
  month,
  plantings,
  balances,
  rainMm,
  isCurrentMonth,
}: CalendarioMesProps) {
  const planting = plantings.find((p) => p.meses.includes(month));
  const crop = planting ? cropById(planting.cropId) : undefined;
  const balance = planting
    ? balances.find((b) => b.plantingId === planting.id)
    : undefined;

  const color = planting ? cropColor(planting.cropId) : "#6E7B6C";
  const faltaAgua = balance ? balance.balanceMm < 0 : false;
  const mesesRestantes = planting
    ? planting.meses.filter((m) => m >= month).length
    : 0;

  const stats = [
    {
      label: "Chuva neste mês",
      value: `${Math.round(rainMm)} mm`,
      sub: "medida pela NASA",
      color: "#2F80C0",
      icon: Droplets,
    },
    {
      label: balance
        ? faltaAgua
          ? "Água que falta"
          : "Água de sobra"
        : "Água",
      value: balance ? `${Math.abs(balance.balanceMm)} mm` : "—",
      sub: balance
        ? `em ${crop?.name ?? "esta cultura"} — ${
            faltaAgua ? "prepara a rega" : "a chuva dá para a cultura"
          }`
        : "sem plantio neste mês",
      color: faltaAgua ? "#B26A00" : "#006B2C",
      icon: Droplets,
    },
    {
      label: "Tempo de cultura",
      value: planting ? monthsShortPeriod(planting.meses) : "—",
      sub: planting
        ? `${mesesRestantes} ${
            mesesRestantes === 1 ? "mês" : "meses"
          } de ${crop?.name?.toLowerCase() ?? "cultura"} pela frente`
        : "mês livre — dá para semear",
      color: "#006B2C",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-text-primary">
        {isCurrentMonth
          ? "Este mês na tua terra"
          : `Escolheste ${MONTHS_LONG[month]}`}
      </h2>

      <Card padding="lg" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-4">
          <span
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[20px] text-white sm:h-24 sm:w-24"
            style={{ backgroundColor: color }}
          >
            <span className="text-2xl font-bold sm:text-3xl">
              {MONTHS_LONG[month].slice(0, 3).toUpperCase()}
            </span>
            <span className="text-sm text-white/80">
              {planting ? `Ciclo ${planting.ciclo + 1}` : "Livre"}
            </span>
          </span>

          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-lg font-bold text-text-primary sm:text-xl">
              {crop ? `${crop.name} no chão` : "Mês livre no calendário"}
            </span>
            <span className="text-base leading-snug text-text-secondary">
              {crop
                ? `${crop.description} — ${
                    planting?.ciclo === 2
                      ? "é a cobertura que protege o solo do calor até à próxima safra."
                      : "acompanha a humidade que a NASA mediu neste mês."
                  }`
                : "Toca num mês vazio no calendário para semear aqui."}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col gap-1 rounded-input bg-surface-soft p-4"
              >
                <span className="flex items-center gap-2 text-[15px] text-text-secondary">
                  <Icon size={16} style={{ color: stat.color }} aria-hidden />
                  {stat.label}
                </span>
                <span className="text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </span>
                <span className="text-sm text-text-muted">{stat.sub}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
