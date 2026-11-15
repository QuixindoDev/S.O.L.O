import React from "react";
import Image from "next/image";
import { CloudSun, Droplets, Sun, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AgroSummary } from "@/types/nasa";

export interface MetricasClimaProps {
  /** Resumo do dia e da semana (NASA POWER). */
  summary: AgroSummary;
}

interface Metrica {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  imagem: string;
}

/**
 * As 4 métricas do dia, cada uma com a sua fotografia.
 *
 * É a primeira coisa que a Dona Maria vê: chuva, humidade, vento e
 * sol — os quatro números que mudam o que ela faz no campo.
 */
export function MetricasClima({ summary }: MetricasClimaProps) {
  const current = summary.current;

  const chuvaMm = Math.round(current?.rainMm ?? 0);
  const humidade = Math.round(current?.humidity ?? summary.avgHumidity ?? 0);
  const mediaSemana = Math.round(
    summary.last7.length
      ? summary.last7.reduce((soma, dia) => soma + dia.humidity, 0) /
          summary.last7.length
      : humidade,
  );
  const vento = Math.round(current?.windSpeed ?? 0);
  const radiacaoKwh = Math.round(((current?.radiation ?? 0) * 0.2778) * 10) / 10;

  const metricas: Metrica[] = [
    {
      label: "Chuva",
      value: `${chuvaMm} mm`,
      note: chuvaMm >= 2 ? "Está a chover" : "Não deve chover",
      icon: Droplets,
      imagem: "/2649_Cuidados_Plantacao_Chuva.png",
    },
    {
      label: "Umidade do Ar",
      value: `${humidade}%`,
      note: `Média na semana: ${mediaSemana}%`,
      icon: CloudSun,
      imagem: "/formacao-de-nuvens.jpg",
    },
    {
      label: "Vento",
      value: `${vento} km/h`,
      note: vento >= 15 ? "Vento forte" : vento >= 6 ? "Vento médio" : "Vento fraco",
      icon: Wind,
      imagem: "/POR-DENTRO-DA-SAFRA-27.png",
    },
    {
      label: "Radiação Solar",
      value: `${radiacaoKwh.toLocaleString("pt-PT", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} kWh`,
      note: radiacaoKwh >= 6 ? "Dia forte" : radiacaoKwh >= 3 ? "Dia médio" : "Dia fraco",
      icon: Sun,
      imagem: "/images.jpg",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metricas.map((metrica) => {
        const Icon = metrica.icon;

        return (
          <div
            key={metrica.label}
            className="relative flex min-h-[168px] flex-col justify-end overflow-hidden rounded-card"
          >
            <Image
              src={metrica.imagem}
              alt=""
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10"
            />

            <span className="relative flex flex-col gap-1 p-4">
              <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary">
                <Icon size={20} aria-hidden />
              </span>
              <span className="text-sm font-bold text-white/90">
                {metrica.label}
              </span>
              <span className="text-2xl font-bold text-white">
                {metrica.value}
              </span>
              <span className="text-sm text-white/80">{metrica.note}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
