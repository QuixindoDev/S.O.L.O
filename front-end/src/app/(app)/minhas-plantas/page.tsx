import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { HarvestCard } from "@/components/features/plantas/HarvestCard";
import { PlantList } from "@/components/features/plantas/PlantList";
import { defaultFarm } from "@/lib/farm";

/**
 * Ecrã 8 — "Minhas Plantas".
 *
 * Dados da própria Dona Maria (canteiros, plantas e colheitas),
 * guardados em `src/data/horta.json`. Num projecto real viriam de um
 * formulário e seriam persistidos.
 */
export default function MinhasPlantasPage() {
  return (
    <AppShell
      title="Minhas Plantas"
      subtitle="O que está plantado e o que você colheu"
      location={defaultFarm.locationLabel}
    >
      <div className="flex flex-col gap-5">
        <PlantList />

        <HarvestCard />
      </div>
    </AppShell>
  );
}
