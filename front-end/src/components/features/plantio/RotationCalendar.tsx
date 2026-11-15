"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { CropIcon } from "@/components/features/plantio/CropIcon";
import {
  MONTHS_LONG,
  MONTHS_SHORT,
  cropColor,
  cropById,
  monthsShortPeriod,
  type Planting,
  type PlantingBalance,
} from "@/lib/plantio";

export interface RotationCalendarProps {
  /** Plantios a mostrar — uma linha por plantio. */
  plantings: Planting[];
  /** Balanço hídrico de cada plantio (mm). */
  balances: PlantingBalance[];
  /** Chuva por mês-do-ano, medida pela NASA (mm). */
  rainByMonth: number[];
  /** Mês escolhido (0-11). */
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
  /** Toca num bloco preenchido → quer tirar. */
  onRemove: (plantingId: string, month: number) => void;
  /** Toca num bloco vazio → quer semear. */
  onAdd: (month: number) => void;
}

/**
 * O calendário da rotação — 12 meses em colunas, uma linha por plantio.
 *
 * Cada bloco colorido é um mês com cultura no chão. Tocar num bloco
 * preenchido abre o diálogo para o tirar; tocar num vazio abre o
 * diálogo para semear. Por baixo, a chuva que a NASA mediu nesse mês.
 */
export function RotationCalendar({
  plantings,
  balances,
  rainByMonth,
  selectedMonth,
  onSelectMonth,
  onRemove,
  onAdd,
}: RotationCalendarProps) {
  const maxRain = Math.max(1, ...rainByMonth);

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] font-bold text-text-primary sm:text-2xl">
          A tua rotação no calendário
        </h2>
        <span className="text-base text-text-muted">
          Toca num bloco para tirar a cultura desse mês, ou num mês vazio
          para semear. As mudanças ficam guardadas.
        </span>
      </div>

      {/* O calendário é largo: no telemóvel rola-se para o lado. */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-[620px] flex-col gap-2">
          {/* Cabeçalho dos meses */}
          <div className="flex items-stretch gap-4">
            <div className="w-[150px] shrink-0" aria-hidden />
            <div className="flex min-w-0 flex-1 gap-1">
              {MONTHS_SHORT.map((month, index) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => onSelectMonth(index)}
                  aria-pressed={selectedMonth === index}
                  aria-label={MONTHS_LONG[index]}
                  className={cn(
                    "flex min-w-0 flex-1 items-center justify-center rounded-md py-1 text-[11px] font-bold transition-colors",
                    selectedMonth === index
                      ? "bg-primary-soft text-primary"
                      : "text-text-muted hover:bg-surface-soft",
                  )}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>

          {/* Uma linha por plantio */}
          {plantings.map((planting) => {
            const color = cropColor(planting.cropId);
            const meses = [...planting.meses].sort((a, b) => a - b);
            const primeiro = meses[0];
            const balance = balances.find((b) => b.plantingId === planting.id);

            return (
              <div
                key={planting.id}
                className="flex items-stretch gap-4"
              >
                <div className="flex w-[150px] shrink-0 items-center gap-2">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  >
                    <CropIcon cropId={planting.cropId} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-bold text-text-primary sm:text-base">
                      {cropName(planting.cropId)}
                    </span>
                    <span className="truncate text-xs text-text-muted">
                      {monthsShortPeriod(meses)}
                    </span>
                    <span
                      className="truncate text-[11px] font-bold"
                      style={{ color }}
                    >
                      Semear em {MONTHS_SHORT[primeiro]}
                    </span>
                    {balance && balance.balanceMm < 0 && (
                      <span className="truncate text-[11px] font-bold text-warning">
                        Faltam {Math.abs(balance.balanceMm)} mm de água
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 gap-1">
                  {MONTHS_SHORT.map((month, monthIndex) => {
                    const ocupado = meses.includes(monthIndex);

                    return (
                      <button
                        key={month}
                        type="button"
                        onClick={() =>
                          ocupado
                            ? onRemove(planting.id, monthIndex)
                            : onAdd(monthIndex)
                        }
                        aria-label={
                          ocupado
                            ? `Tirar ${cropName(planting.cropId)} de ${MONTHS_LONG[monthIndex]}`
                            : `Semear em ${MONTHS_LONG[monthIndex]}`
                        }
                        className={cn(
                          "group flex h-[60px] min-w-0 flex-1 items-center justify-center rounded-lg transition-colors",
                          ocupado
                            ? "text-white hover:opacity-85"
                            : "bg-surface-soft text-text-muted hover:bg-primary-soft hover:text-primary",
                        )}
                        style={ocupado ? { backgroundColor: color } : undefined}
                      >
                        {ocupado && monthIndex === primeiro && (
                          <CropIcon cropId={planting.cropId} size={18} />
                        )}
                        {!ocupado && (
                          <Plus
                            size={16}
                            className="opacity-30 transition-opacity group-hover:opacity-100"
                            aria-hidden
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Chuva medida pela NASA */}
          <div className="flex items-end gap-4">
            <div className="flex w-[150px] shrink-0 flex-col gap-0.5 pb-1">
              <span className="text-[13px] font-bold text-text-secondary">
                Chuva (NASA)
              </span>
              <span className="text-xs text-text-muted">mm por mês</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex h-[60px] items-end gap-1">
                {rainByMonth.map((mm, index) => (
                  <div
                    key={index}
                    className="flex min-w-0 flex-1 items-end justify-center"
                    title={`${MONTHS_LONG[index]}: ${Math.round(mm)} mm`}
                  >
                    <span
                      className="w-full rounded-t-[6px] bg-[#8FB8D6]"
                      style={{
                        height: `${Math.max(3, Math.round((mm / maxRain) * 56))}px`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="h-px w-full bg-border" />
            </div>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4">
        {plantings.map((planting) => (
          <span key={planting.id} className="flex items-center gap-2">
            <span
              className="h-3.5 w-3.5 rounded-full"
              style={{ backgroundColor: cropColor(planting.cropId) }}
              aria-hidden
            />
            <span className="text-sm text-text-secondary">
              {cropName(planting.cropId)} · {monthsShortPeriod(planting.meses)}
            </span>
          </span>
        ))}
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-[#8FB8D6]" aria-hidden />
          <span className="text-sm text-text-secondary">
            Chuva medida pela NASA
          </span>
        </span>
      </div>
    </Card>
  );
}

/** Nome da cultura — o id serve de recurso se o crop não existir. */
function cropName(cropId: string): string {
  return cropById(cropId)?.name ?? cropId;
}
