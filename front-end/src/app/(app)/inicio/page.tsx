import React from "react";
import { CloudRain, Droplets, Sun } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { IconBox } from "@/components/ui/IconBox";
import { GardenCard } from "@/components/features/dashboard/GardenCard";
import { QuickActions } from "@/components/features/dashboard/QuickActions";
import { TipsGrid } from "@/components/features/dashboard/TipsGrid";
import { WeatherCard } from "@/components/features/dashboard/WeatherCard";
import { estimateSoilMoisture } from "@/lib/agronomia";
import { defaultFarm } from "@/lib/farm";
import { getAgroSummary } from "@/lib/nasa/client";

/**
 * Ecrã 4 — "Meu Caderno da Terra" (Início).
 *
 * É um Server Component: os dados do satélite são buscados no servidor
 * e chegam já no HTML, para o ecrã aparecer de imediato no 3G rural.
 *
 * ISR: a página é gerada estaticamente e revalidada uma vez por dia,
 * em sincronia com a actualização da NASA POWER.
 */
export const revalidate = 86400;

export default async function InicioPage() {
  const summary = await getAgroSummary(
    defaultFarm.latitude,
    defaultFarm.longitude,
  );

  const current = summary.current;
  const greeting = current
    ? `${current.dayOfWeek}, ${current.label} · ${defaultFarm.city} - ${defaultFarm.state}`
    : `${defaultFarm.city} - ${defaultFarm.state}`;

  // O estado do solo vem do mesmo modelo do ecrã 7 — os dois ecrãs
  // têm de contar a mesma história, senão a Dona Maria deixa de
  // confiar em nós.
  const moisture = estimateSoilMoisture(summary, defaultFarm.soil);
  const raining = (current?.rainMm ?? 0) >= 2;

  const dry = moisture.status === "seco" || moisture.status === "precisa_agua";

  // Quatro combinações: chuva × solo. A mensagem tem de fazer sentido
  // em todas — e nunca se pode dizer "não regue" e "regue" ao mesmo tempo.
  const notice = raining
    ? dry
      ? {
          title: "Está a chover — boa notícia para a terra seca",
          text: "A chuva vai ajudar as raízes. Não precisa de regar hoje.",
          icon: CloudRain,
          tone: "bg-primary-soft",
        }
      : {
          title: "Está a chover — bom dia para a horta coberta",
          text: "Não precisa de regar. A chuva está a fazer o trabalho por si.",
          icon: CloudRain,
          tone: "bg-primary-soft",
        }
    : dry
      ? {
          title: "O solo está seco — vale a pena regar hoje",
          text: moisture.advice,
          icon: Droplets,
          tone: "bg-warning-soft",
        }
      : {
          title: "Hoje é um ótimo dia para cuidar da horta",
          text: "O solo está bem úmido. Não precisa regar.",
          icon: Sun,
          tone: "bg-primary-soft",
        };

  return (
    <AppShell
      title={`Bom dia, ${defaultFarm.userName}!`}
      subtitle={greeting}
      location={defaultFarm.locationLabel}
    >
      <div className="flex flex-col gap-5">
        {/* Aviso do dia */}
        <div
          className={`flex items-center gap-3.5 rounded-input px-5 py-4 ${notice.tone}`}
        >
          <IconBox icon={notice.icon} tone="surface" size="sm" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-lg font-bold text-text-primary">
              {notice.title}
            </span>
            <span className="text-base text-text-secondary">{notice.text}</span>
          </div>
        </div>

        {/* Clima + Terra */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <WeatherCard summary={summary} city={defaultFarm.city} />
          <GardenCard moisture={moisture} />
        </div>

        {/* Dicas */}
        <TipsGrid />

        {/* Atalhos */}
        <QuickActions />
      </div>
    </AppShell>
  );
}
