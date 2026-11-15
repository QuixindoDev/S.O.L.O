"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { calcularRendaCarbono, formatarKz } from "@/lib/carbono";
import { defaultFarm } from "@/lib/farm";
import {
  defaultPlantings,
  loadSavedRotation,
  type Planting,
} from "@/lib/plantio";
import { ROTATION_PLANS } from "@/lib/rotacao";
import { loadSaques, totalSacado, descreverMetodo, loadMetodoSaque, type MetodoSaque, type Saque } from "@/lib/saques";

export interface CartaoRendaCarbonoProps {
  /**
   * Quando vem preenchido, o botão abre o diálogo de saque (no ecrã
   * da renda). Sem ele, o botão leva ao ecrã da renda.
   */
  onSacar?: () => void;
  /** Área da terra em hectares (vem do perfil no back-end). */
  areaHectares?: number;
}

/**
 * "Quanto podes sacar agora" — o carbono da tua terra em dinheiro.
 *
 * É o cartão que liga a ecologia ao bolso: a rotação guarda
 * carbono, o carbono vira renda, e a renda pode-se levantar.
 */
export function CartaoRendaCarbono({
  onSacar,
  areaHectares = defaultFarm.areaHectares,
}: CartaoRendaCarbonoProps) {
  const [plantings, setPlantings] = useState<Planting[]>(() =>
    defaultPlantings([...ROTATION_PLANS[0].crops]),
  );
  const [saques, setSaques] = useState<Saque[]>([]);
  const [metodo, setMetodo] = useState<MetodoSaque | null>(null);

  useEffect(() => {
    const guardado = loadSavedRotation();
    if (guardado?.plantings && guardado.plantings.length > 0) {
      setPlantings(guardado.plantings);
    } else if (guardado?.selection) {
      setPlantings(
        defaultPlantings([
          guardado.selection.cycle1CropId,
          guardado.selection.cycle2CropId,
          guardado.selection.cycle3CropId,
        ]),
      );
    }
    setSaques(loadSaques());
    setMetodo(loadMetodoSaque());
  }, []);

  const resumo = useMemo(
    () => calcularRendaCarbono(plantings, areaHectares),
    [plantings, areaHectares],
  );

  const disponivel = Math.max(0, resumo.rendaKz - totalSacado(saques));

  return (
    <div className="relative overflow-hidden rounded-card">
      <Image
        src="/2649_Cuidados_Plantacao_Chuva.png"
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 940px"
        className="object-cover"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/60"
      />

      <div className="relative flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <span className="text-base font-bold text-primary-soft">
            Quanto podes sacar agora
          </span>
          <span className="text-4xl font-bold text-white sm:text-[40px]">
            {formatarKz(disponivel)}
          </span>
          <span className="text-base text-primary-soft">
            {`Já sacaste ${formatarKz(totalSacado(saques))} este ano. O carbono que a tua terra guarda vira renda.`}
          </span>
          <span className="text-sm text-primary-soft">
            {descreverMetodo(metodo)}
          </span>
        </div>

        {onSacar ? (
          <button
            type="button"
            onClick={onSacar}
            className="inline-flex h-14 shrink-0 items-center gap-2.5 rounded-full bg-surface px-7 text-lg font-bold text-primary transition-opacity hover:opacity-90"
          >
            <Wallet size={20} aria-hidden />
            Sacar o meu dinheiro
          </button>
        ) : (
          <Link
            href="/renda-da-terra"
            className="inline-flex h-14 shrink-0 items-center gap-2.5 rounded-full bg-surface px-7 text-lg font-bold text-primary transition-opacity hover:opacity-90"
          >
            <Wallet size={20} aria-hidden />
            Sacar o meu dinheiro
          </Link>
        )}
      </div>
    </div>
  );
}
