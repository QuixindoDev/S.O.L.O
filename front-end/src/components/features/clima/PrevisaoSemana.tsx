import React from "react";
import Image from "next/image";
import { Cloud, CloudRain, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { DailyPoint } from "@/types/nasa";

export interface PrevisaoSemanaProps {
  /** Os 7 dias — do mais recente para o mais antigo. */
  days: DailyPoint[];
}

/** A fotografia de cada estado do céu. */
const IMAGENS: Record<string, string> = {
  sun: "/images.jpg",
  cloud: "/formacao-de-nuvens.jpg",
  rain: "/chuva_lavoura.jpg",
};

const ICONES: Record<string, LucideIcon> = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
};

/**
 * "Os próximos 7 dias" — um cartão por dia, com a fotografia do
 * céu, a temperatura e a chuva prevista.
 */
export function PrevisaoSemana({ days }: PrevisaoSemanaProps) {
  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-text-primary">
          Os próximos 7 dias
        </h2>
        <p className="text-base text-text-muted">
          Toca num dia para ouvir a previsão
        </p>
      </div>

      {days.length === 0 ? (
        <div className="rounded-input border border-dashed border-border px-6 py-10 text-center">
          <p className="text-lg font-bold text-text-primary">
            Sem observações para mostrar
          </p>
          <p className="mt-1 text-base text-text-secondary">
            O satélite ainda não passou por esta região. Tente novamente mais
            tarde.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((dia) => {
            const Icon = ICONES[dia.condition] ?? Sun;
            const imagem = IMAGENS[dia.condition] ?? IMAGENS.sun;

            return (
              <button
                key={dia.date}
                type="button"
                className="relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-input text-left"
              >
                <Image
                  src={imagem}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 14vw"
                  className="object-cover"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20"
                />

                <span className="relative flex flex-col gap-0.5 p-3">
                  <span className="text-sm font-bold text-white/90">
                    {dia.dayOfWeek}
                  </span>
                  <span className="text-2xl font-bold text-white">
                    {dia.dayNumber}
                  </span>
                </span>

                <span className="relative flex flex-col items-center gap-2 p-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-primary">
                    <Icon size={26} aria-hidden />
                  </span>

                  <span className="flex items-center gap-2 text-sm font-bold text-white">
                    <span>{Math.round(dia.tMax)}°</span>
                    <span className="text-white/70">{Math.round(dia.tMin)}°</span>
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      dia.rainMm >= 2
                        ? "bg-water text-white"
                        : "bg-white/85 text-text-secondary"
                    }`}
                  >
                    {Math.round(dia.rainMm)} mm
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
