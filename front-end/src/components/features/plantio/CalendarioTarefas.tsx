"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Circle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  cropById,
  cropColor,
  MONTHS_LONG,
  monthsShortPeriod,
  taskForCrop,
  type Planting,
} from "@/lib/plantio";

export interface CalendarioTarefasProps {
  /** Plantios do calendário — uma tarefa por plantio. */
  plantings: Planting[];
}

/**
 * "O que fazer no teu campo" — as tarefas do calendário, com o mês
 * em que cada uma cai. É a lista que a Dona Maria vai seguir.
 */
export function CalendarioTarefas({ plantings }: CalendarioTarefasProps) {
  const tarefas = plantings.map((planting) => {
    const crop = cropById(planting.cropId);
    const base = crop ? taskForCrop(crop) : null;
    const meses = [...planting.meses].sort((a, b) => a - b);

    return {
      id: planting.id,
      nome: base?.nome ?? `Semear ${crop?.name ?? planting.cropId}`,
      descricao:
        base?.descricao ??
        crop?.description ??
        "Prepara o terreno e semeia quando a chuva aparecer.",
      mes: meses[0] ?? 0,
      cor: cropColor(planting.cropId),
      periodo: monthsShortPeriod(meses),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-text-primary">
        O que fazer no teu campo
      </h2>

      <Card padding="lg" className="flex flex-col gap-4">
        {tarefas.length === 0 && (
          <p className="text-base text-text-muted">
            Ainda não há plantios no calendário. Toca num mês vazio para
            semear a tua primeira cultura.
          </p>
        )}

        {tarefas.map((tarefa) => (
          <div
            key={tarefa.id}
            className="flex items-center gap-3 sm:gap-4"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-surface"
              style={{ borderColor: tarefa.cor }}
              aria-hidden
            >
              <Circle size={12} className="text-text-muted" />
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-base font-bold text-text-primary sm:text-[17px]">
                {tarefa.nome}
              </span>
              <span className="text-sm leading-snug text-text-secondary sm:text-[15px]">
                {tarefa.descricao}
              </span>
            </span>

            <span
              className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold"
              style={{
                backgroundColor: `${tarefa.cor}1a`,
                color: tarefa.cor,
              }}
            >
              {MONTHS_LONG[tarefa.mes]}
            </span>
          </div>
        ))}
      </Card>

      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center justify-between gap-4 rounded-card bg-primary p-5">
          <span className="flex flex-col gap-1">
            <span className="text-lg font-bold text-white">
              Queres mudar a rotação?
            </span>
            <span className="text-base text-primary-soft">
              Volta ao ecrã Rotação de Culturas e escolhe outro plano — o
              calendário muda contigo.
            </span>
          </span>

          <Link
            href="/rotacao-de-culturas"
            className="inline-flex h-14 shrink-0 items-center gap-2.5 rounded-full bg-surface px-6 text-lg font-bold text-primary transition-opacity hover:opacity-90"
          >
            Ver a minha rotação
            <ArrowRight size={20} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
