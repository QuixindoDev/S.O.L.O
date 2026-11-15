"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CloudRain,
  MapPin,
  Sun,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IconBox } from "@/components/ui/IconBox";
import type { AgroSummary } from "@/types/nasa";

export interface WeatherCardProps {
  summary: AgroSummary | null;
  city: string;
}

/**
 * Cartão "Tempo & Chuva Hoje" — o primeiro bloco do ecrã Início.
 * Mostra a condição actual medida pelo satélite da NASA.
 */
export function WeatherCard({ summary, city }: WeatherCardProps) {
  const router = useRouter();
  const current = summary?.current;

  const temp = current ? Math.round(current.tMean) : 28;
  const max = current ? Math.round(current.tMax) : 33;
  const min = current ? Math.round(current.tMin) : 22;
  const rain = current ? Math.round(current.rainMm) : 0;

  const feeling = temp >= 32 ? "Muito quente" : temp >= 26 ? "Agradável" : "Fresco";

  const description = current
    ? current.condition === "rain"
      ? "Está a chover. Bom dia para ficar em casa e cuidar da horta coberta."
      : current.condition === "cloud"
        ? "Céu com algumas nuvens. Vento brando. Dá para trabalhar à vontade."
        : "Céu limpo e sol forte. Regue de manhã bem cedo ou ao fim da tarde."
    : "A carregar a observação mais recente do satélite.";

  const rainNote =
    rain === 0
      ? "Não choveu no último dia medido. Ótima hora para molhar as plantas com calma."
      : `Choveu ${rain} mm no último dia medido. Não precisa de regar.`;

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <Eyebrow icon={Sun}>PREVISÃO DA ROÇA</Eyebrow>

      <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
        Tempo & Chuva Hoje
      </h2>

      <div className="flex items-center gap-2.5">
        <MapPin size={20} className="shrink-0 text-text-muted" aria-hidden />
        <span className="text-base text-text-muted">{city}</span>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <div className="flex flex-col">
          <span className="text-base text-text-muted">Temperatura do ar</span>
          <span className="text-5xl font-bold text-primary tabular-nums sm:text-[52px]">
            {temp}°C
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div>
            <Badge>{feeling}</Badge>
          </div>
          <p className="text-base leading-relaxed text-text-secondary sm:text-[17px]">
            {description}
          </p>
        </div>
      </div>

      <Divider />

      <div className="flex items-center gap-3.5">
        <IconBox icon={CloudRain} tone="soft" />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-lg font-bold text-text-primary">
            Chuva: {rain} mm
          </span>
          <span className="text-base leading-snug text-text-secondary">
            {rainNote}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-1">
        <Button fullWidth icon={CalendarDays} onClick={() => router.push("/previsao-do-tempo")}>
          Ver os próximos 7 dias
        </Button>
      </div>
    </Card>
  );
}
