"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AdvancedStep } from "@/components/features/rotacao/AdvancedStep";
import { DiagnosisStep } from "@/components/features/rotacao/DiagnosisStep";
import { PresetStep } from "@/components/features/rotacao/PresetStep";
import { PriorityStep } from "@/components/features/rotacao/PriorityStep";
import { WizardStepper } from "@/components/features/rotacao/WizardStepper";
import { useSimulator } from "@/hooks/useSimulator";
import { defaultFarm } from "@/lib/farm";
import { planForGoal, ROTATION_PLANS } from "@/lib/rotacao";
import { loadSavedRotation, plantingsForSelection, saveRotation } from "@/lib/plantio";
import cropsDatabase from "@/data/crops.json";
import type {
  BiomeType,
  CropProfile,
  FarmerPriority,
  RotationSequenceSelection,
  SoilTextureType,
} from "@/types/agronomy";
import type { AgroSummary } from "@/types/nasa";

const crops = cropsDatabase as CropProfile[];

type WizardStep = 1 | 2 | 3 | "advanced";

const COPY: Record<WizardStep, { title: string; subtitle: string }> = {
  1: {
    title: "Rotação de Culturas",
    subtitle: "Passo 1 de 3 · Diz-nos o que é mais importante este ano",
  },
  2: {
    title: "A tua Rotação Recomendada",
    subtitle: "Passo 2 de 3 · Combinações testadas com os dados da NASA",
  },
  3: {
    title: "O Diagnóstico da Agrônoma",
    subtitle: "Passo 3 de 3 · Em português simples, sem fórmulas",
  },
  advanced: {
    title: "Montar a Minha Rotação",
    subtitle: "Plano 4 · Escolhe tu as culturas de cada ciclo",
  },
};

export interface RotationWizardProps {
  /** Resumo de um ano de dados da NASA POWER. */
  summary: AgroSummary | null;
}

function selectionFromPlan(planId: string): RotationSequenceSelection {
  const plan = ROTATION_PLANS.find((p) => p.id === planId) ?? ROTATION_PLANS[0];
  return {
    cycle1CropId: plan.crops[0],
    cycle2CropId: plan.crops[1],
    cycle3CropId: plan.crops[2],
  };
}

/**
 * Ecrã 5 — "Rotação de Culturas" (simulador).
 *
 * Um guia de 3 passos, pensado para quem não vive de tabelas:
 *  1. o que queres priorizar este ano;
 *  2. a combinação pronta que a NASA recomenda (ou o Plano 4, para
 *     quem quer escolher cultura a cultura);
 *  3. o diagnóstico da agrônoma em português simples.
 */
export function RotationWizard({ summary }: RotationWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [priority, setPriority] = useState<FarmerPriority>("agua");
  const [activePlanId, setActivePlanId] = useState<string>(
    ROTATION_PLANS[0].id,
  );
  const [selection, setSelection] = useState<RotationSequenceSelection>(() =>
    selectionFromPlan(ROTATION_PLANS[0].id),
  );
  const [saved, setSaved] = useState(false);

  // Se a Dona Maria já guardou uma rotação (ou mexeu no calendário),
  // o ecrã começa nessa — nada se perde entre ecrãs.
  useEffect(() => {
    const guardado = loadSavedRotation();
    if (!guardado) return;

    if (guardado.plantings && guardado.plantings.length > 0) {
      const porCiclo = [0, 1, 2].map((ciclo) =>
        guardado.plantings?.find((p) => p.ciclo === ciclo)?.cropId,
      );
      if (porCiclo.every(Boolean)) {
        setSelection({
          cycle1CropId: porCiclo[0] as string,
          cycle2CropId: porCiclo[1] as string,
          cycle3CropId: porCiclo[2] as string,
        });
        return;
      }
    }

    if (guardado.selection) {
      setSelection(guardado.selection);
      const plan = ROTATION_PLANS.find(
        (p) =>
          p.crops[0] === guardado.selection?.cycle1CropId &&
          p.crops[1] === guardado.selection?.cycle2CropId &&
          p.crops[2] === guardado.selection?.cycle3CropId,
      );
      if (plan) setActivePlanId(plan.id);
    }
  }, []);

  // O solo e a região vêm do perfil da fazenda — o ecrã 7 (Minha Terra)
  // é onde a pessoa os muda.
  const soil: SoilTextureType = defaultFarm.soil;
  const biome: BiomeType = "savana";

  const result = useSimulator(biome, soil, priority, selection, summary);

  const copy = COPY[step];

  const handleGoalChange = (goal: FarmerPriority) => {
    const plan = planForGoal(goal);
    setPriority(goal);
    setActivePlanId(plan.id);
    setSelection(selectionFromPlan(plan.id));
    setSaved(false);
  };

  const handlePlanSelect = (planId: string) => {
    const plan = ROTATION_PLANS.find((p) => p.id === planId);
    if (!plan) return;
    setActivePlanId(planId);
    setPriority(plan.priority);
    setSelection(selectionFromPlan(planId));
    setSaved(false);
  };

  const handleCropChange = (index: number, cropId: string) => {
    setSelection((prev) =>
      index === 0
        ? { ...prev, cycle1CropId: cropId }
        : index === 1
          ? { ...prev, cycle2CropId: cropId }
          : { ...prev, cycle3CropId: cropId },
    );
    setSaved(false);
  };

  const handleSave = () => {
    const plantings = plantingsForSelection(
      selection,
      loadSavedRotation()?.plantings,
    );

    saveRotation({
      planId: activePlanId,
      selection,
      score: result.overallScore,
      plantings,
    });
    setSaved(true);
  };

  const showStepper = step === 1 || step === 2 || step === 3;

  function renderStep() {
    if (step === 1) {
      return (
        <PriorityStep
          value={priority}
          onChange={handleGoalChange}
          onNext={() => setStep(2)}
          onAdvanced={() => setStep("advanced")}
        />
      );
    }

    if (step === 2) {
      return (
        <PresetStep
          activePlanId={activePlanId}
          onSelect={handlePlanSelect}
          onNext={() => setStep(3)}
          onAdvanced={() => setStep("advanced")}
          crops={crops}
        />
      );
    }

    if (step === "advanced") {
      return (
        <AdvancedStep
          selection={selection}
          onChange={handleCropChange}
          crops={crops}
          result={result}
          onBackToPresets={() => setStep(2)}
          onConfirm={() => setStep(3)}
        />
      );
    }

    return (
      <DiagnosisStep
        result={result}
        onSave={handleSave}
        onBack={() => setStep(2)}
      />
    );
  }

  return (
    <AppShell
      title={copy.title}
      subtitle={copy.subtitle}
      location={defaultFarm.locationLabel}
    >
      <div className="flex flex-col gap-6">
        {showStepper && <WizardStepper current={step as number} />}

        {saved && (
          <p
            role="status"
            className="rounded-card border border-primary bg-primary-soft px-5 py-4 text-base font-bold text-primary"
          >
            Rotação guardada no teu caderno da terra.
          </p>
        )}

        {renderStep()}
      </div>
    </AppShell>
  );
}
