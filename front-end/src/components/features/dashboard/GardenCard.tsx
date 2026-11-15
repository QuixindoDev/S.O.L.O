"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { Eyebrow } from "@/components/ui/Eyebrow";

export interface GardenCardProps {
  /** Nome do canteiro principal */
  plotName?: string;
  /** Plantas que estão lá */
  crops?: string;
  /** Umidade do solo em % (dado SMAP) */
  moisturePct?: number;
}

/**
 * Cartão "Minha Terra & Horta" — o canteiro activo e a humidade do solo.
 */
export function GardenCard({
  plotName = "Canteiro Principal",
  crops = "Alface, Couve e Tomate Cereja",
  moisturePct = 72,
}: GardenCardProps) {
  const router = useRouter();

  const state =
    moisturePct >= 60
      ? { label: "Ideal", tone: "primary" as const }
      : moisturePct >= 40
        ? { label: "Precisa de água", tone: "warning" as const }
        : { label: "Seco, cuidado", tone: "danger" as const };

  const note =
    moisturePct >= 60
      ? "A terra está úmida na medida certa. Boa de plantar e afofar."
      : "O solo está a secar. Convém regar cedo de manhã, antes do sol.";

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <Eyebrow icon={Sprout}>CANTEIRO ATIVO</Eyebrow>

      <h2 className="text-2xl font-bold text-text-primary sm:text-[26px]">
        Minha Terra & Horta
      </h2>

      <div className="flex flex-col gap-0.5">
        <span className="text-lg font-bold text-text-primary">{plotName}</span>
        <span className="text-base text-text-muted">{crops}</span>
      </div>

      <Divider />

      <span className="text-lg font-bold text-text-primary">Umidade da Terra</span>

      <div>
        <Badge tone={state.tone}>Ideal ({moisturePct}%)</Badge>
      </div>

      <p className="text-base leading-relaxed text-text-secondary sm:text-[17px]">
        {note}
      </p>

      <div className="mt-auto pt-1">
        <Button
          fullWidth
          variant="soft"
          icon={Plus}
          onClick={() => router.push("/minhas-plantas")}
        >
          Anotar planta ou colheita
        </Button>
      </div>
    </Card>
  );
}
