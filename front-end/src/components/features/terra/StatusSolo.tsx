import React from "react";
import Image from "next/image";
import { Droplets, Snowflake, Sprout, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { SoilMoisture } from "@/lib/agronomia";

export interface StatusSoloProps {
  /** Estado do solo — o mesmo modelo do ecrã "Minha Terra e Horta". */
  moisture: SoilMoisture;
}

/**
 * "Como está a sua terra" — a fotografia do campo, o medidor da
 * humidade da raiz e os quatro números que a Dona Maria usa para
 * decidir se rega ou não.
 */
export function StatusSolo({ moisture }: StatusSoloProps) {
  const pct = Math.round(moisture.rootZonePct ?? 0);
  const estado =
    pct >= 60
      ? { label: "Ideal", tone: "primary" as const }
      : pct >= 35
        ? { label: "Precisa de água", tone: "warning" as const }
        : { label: "Seco, cuidado", tone: "danger" as const };

  const metricas: {
    label: string;
    value: string;
    note: string;
    icon: LucideIcon;
  }[] = [
    {
      label: "Umidade na Raiz",
      value: `${Math.round(moisture.rootZonePct ?? 0)}%`,
      note:
        pct >= 60
          ? "Na medida certa para plantar"
          : "Precisa de água para as raízes",
      icon: Droplets,
    },
    {
      label: "Umidade na Superfície",
      value: `${Math.round(moisture.surfacePct ?? 0)}%`,
      note:
        (moisture.surfacePct ?? 0) >= 50
          ? "O solo de cima está úmido"
          : "O solo de cima está seco",
      icon: Sprout,
    },
    {
      label: "Temperatura do Solo",
      value: `${Math.round(moisture.soilTemperatureC ?? 0)}°C`,
      note:
        (moisture.soilTemperatureC ?? 0) <= 26
          ? "Frio bom para as raízes"
          : "Quente — rega ao fim do dia",
      icon: Snowflake,
    },
    {
      label: "Dias sem Chuva",
      value: `${moisture.daysSinceRain ?? 0} dias`,
      note:
        (moisture.daysSinceRain ?? 0) >= 7
          ? "Aguarde a chuva — não regue ainda"
          : "A chuva está por perto",
      icon: Sun,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-card">
      <Image
        src="/monitoramento-satelite-chuva-fogo-agricultura.webp"
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 940px"
        className="object-cover"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10"
      />

      <div className="relative flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white sm:text-[28px]">
              Como está a sua terra
            </h2>
            <p className="text-base text-white/85">
              Umidade do solo pela NASA SMAP
            </p>
          </div>

          <span className="rounded-full bg-white/95 p-1">
            <ScoreRing
              value={pct}
              label={estado.label}
              size={130}
              tone={estado.tone}
            />
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metricas.map((metrica) => {
            const Icon = metrica.icon;

            return (
              <div
                key={metrica.label}
                className="flex flex-col gap-1 rounded-input bg-white/95 p-4"
              >
                <span className="flex items-center gap-2 text-sm text-text-secondary">
                  <Icon size={16} className="text-primary" aria-hidden />
                  {metrica.label}
                </span>
                <span className="text-2xl font-bold text-text-primary">
                  {metrica.value}
                </span>
                <span className="text-sm leading-snug text-text-muted">
                  {metrica.note}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
