"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarioMes } from "@/components/features/plantio/CalendarioMes";
import { CalendarioTarefas } from "@/components/features/plantio/CalendarioTarefas";
import { DialogoPlantao, type DialogoAlvo } from "@/components/features/plantio/DialogoPlantao";
import { RotationCalendar } from "@/components/features/plantio/RotationCalendar";
import { referenceEvapotranspiration } from "@/lib/agronomia";
import { defaultFarm } from "@/lib/farm";
import { ROTATION_PLANS } from "@/lib/rotacao";
import {
  cropById,
  cycleMonths,
  defaultPlantings,
  loadSavedRotation,
  plantingWaterBalance,
  saveRotation,
  type Planting,
} from "@/lib/plantio";
import type { AgroSummary } from "@/types/nasa";

const EMPTY_SUMMARY: AgroSummary = {
  latitude: 0,
  longitude: 0,
  elevationM: 0,
  current: null,
  last7: [],
  series: [],
  monthlyRainMm: {},
  rainByMonthOfYear: {},
  annualRainMm: 0,
  avgTMax: 0,
  avgTMin: 0,
  avgHumidity: 0,
  lastSatellitePass: null,
  daysSinceRain: 0,
};

export interface CalendarioPlantioProps {
  /** Resumo de um ano de dados da NASA POWER. */
  summary: AgroSummary | null;
}

/**
 * Ecrã 10 — "Calendário de Plantio".
 *
 * Um calendário a sério: os 12 meses em colunas, uma linha por
 * plantio e, por baixo, a chuva que a NASA mediu em cada mês.
 *
 * A Dona Maria edita o calendário: toca num bloco para tirar a
 * cultura desse mês, toca num mês vazio para semear. Tudo o que
 * muda é guardado no dispositivo (e depois vai para o banco).
 */
export function CalendarioPlantio({ summary }: CalendarioPlantioProps) {
  const [plantings, setPlantings] = useState<Planting[]>(() =>
    defaultPlantings([...ROTATION_PLANS[0].crops]),
  );
  const [dialogo, setDialogo] = useState<DialogoAlvo>(null);

  const currentMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // A rotação e o calendário guardados no ecrã Rotação de Culturas.
  useEffect(() => {
    const saved = loadSavedRotation();
    if (!saved) return;

    if (saved.plantings && saved.plantings.length > 0) {
      setPlantings(saved.plantings);
      return;
    }

    if (saved.selection) {
      setPlantings(
        defaultPlantings([
          saved.selection.cycle1CropId,
          saved.selection.cycle2CropId,
          saved.selection.cycle3CropId,
        ]),
      );
    }
  }, []);

  // Balanço hídrico real: chuva e radiação da NASA POWER.
  const balances = useMemo(
    () =>
      plantingWaterBalance(
        plantings,
        summary ?? EMPTY_SUMMARY,
        defaultFarm.soil,
        (point) => referenceEvapotranspiration(point, summary?.latitude ?? 0),
      ),
    [plantings, summary],
  );

  // Chuva por mês-do-ano (mm), medida pela NASA.
  const rainByMonth = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const key = String(index + 1).padStart(2, "0");
        return summary?.rainByMonthOfYear[key] ?? 0;
      }),
    [summary],
  );

  /** Guarda o calendário no dispositivo. */
  function persist(next: Planting[]) {
    setPlantings(next);
    saveRotation({ plantings: next });
  }

  /** Toca num bloco com cultura → pergunta se quer tirar. */
  function handleRemove(plantingId: string, month: number) {
    const planting = plantings.find((p) => p.id === plantingId);
    if (!planting) return;
    setDialogo({ tipo: "remover", planting, mes: month });
  }

  /** Toca num mês vazio → pergunta que cultura quer semear. */
  function handleAdd(month: number) {
    setDialogo({ tipo: "adicionar", mes: month });
  }

  /** Tira o mês do plantio (ou o plantio todo, se ficar vazio). */
  function confirmRemove(plantingId: string, month: number) {
    persist(
      plantings
        .map((planting) => {
          if (planting.id !== plantingId) return planting;
          const meses = planting.meses.filter((m) => m !== month);
          return { ...planting, meses };
        })
        .filter((planting) => planting.meses.length > 0),
    );
  }

  /** Acrescenta a cultura ao mês — se já existir a mesma cultura ao lado, junta ao mesmo plantio. */
  function confirmAdd(month: number, cropId: string) {
    // A mesma cultura já semeada no mês ao lado? Junta-se ao mesmo plantio.
    const vizinho = plantings.find(
      (planting) =>
        planting.cropId === cropId &&
        !planting.meses.includes(month) &&
        planting.meses.some((m) => Math.abs(m - month) === 1),
    );

    if (vizinho) {
      persist(
        plantings.map((planting) =>
          planting.id === vizinho.id
            ? { ...planting, meses: [...planting.meses, month] }
            : planting,
        ),
      );
      return;
    }

    // O mês já está ocupado por outra cultura? Não se pode semear duas.
    const ocupado = plantings.some((planting) => planting.meses.includes(month));
    if (ocupado) return;

    const ciclo = cycleMonths(0).includes(month)
      ? 0
      : cycleMonths(1).includes(month)
        ? 1
        : 2;

    persist([
      ...plantings,
      {
        id: `plantio-${cropId}-${month}-${Date.now()}`,
        cropId,
        ciclo,
        meses: [month],
      },
    ]);
  }

  const rainMm = rainByMonth[selectedMonth] ?? 0;

  return (
    <AppShell
      title="Calendário de Plantio"
      subtitle="O que plantar, quando e como cuidar"
      location={defaultFarm.locationLabel}
    >
      <div className="flex flex-col gap-6">
        <RotationCalendar
          plantings={plantings}
          balances={balances}
          rainByMonth={rainByMonth}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          onRemove={handleRemove}
          onAdd={handleAdd}
        />

        <CalendarioTarefas plantings={plantings} />
      </div>

      <DialogoPlantao
        alvo={dialogo}
        onClose={() => setDialogo(null)}
        onRemover={confirmRemove}
        onAdicionar={confirmAdd}
      />
    </AppShell>
  );
}
