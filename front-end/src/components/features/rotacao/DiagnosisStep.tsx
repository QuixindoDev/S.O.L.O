"use client";

import React, { useEffect, useState } from "react";
import { Check, Pause, Play, Satellite, UserRound, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { diagnosticoSimples } from "@/lib/rotacao";
import type { RotationSimulation } from "@/hooks/useSimulator";

export interface DiagnosisStepProps {
  result: RotationSimulation;
  /** "Guardar a minha rotação" — grava no caderno da terra. */
  onSave: () => void;
  /** Volta ao Passo 2 para mudar de plano. */
  onBack: () => void;
  /**
   * Leguminosas regenerativas sugeridas pelo servidor
   * (GET /api/v1/crops do back-end).
   */
  leguminosas?: LeguminosaServidor[];
}

/** Uma leguminosa regenerativa, como a devolvida pelo back-end. */
export interface LeguminosaServidor {
  nome: string;
  nome_cientifico: string;
  funcao: string;
  taxa_sequestro_media: string;
}

/**
 * Passo 3 — "O Diagnóstico da Agrônoma".
 *
 * O texto é escrito para ser ouvido, não lido: frases curtas,
 * números concretos e nada de fórmulas. O botão de áudio usa a
 * leitura por voz do próprio telemóvel (pt-PT).
 */
export function DiagnosisStep({
  result,
  onSave,
  onBack,
  leguminosas = [],
}: DiagnosisStepProps) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSupported(true);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const texto = diagnosticoSimples({
    cycleNames: result.cycleNames,
    balance: result.balance,
    nitrogenKgHa: result.estimatedNitrogenBalanceKgHa,
    overallScore: result.overallScore,
  });

  function handleSpeak() {
    if (!supported || typeof window === "undefined") return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "pt-PT";
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  const metrics = [
    {
      label: "Guarda de água",
      value: result.waterEfficiencyScore,
      color: "bg-primary",
    },
    {
      label: "Terra mais fértil",
      value: result.soilRegenerationScore,
      color: "bg-primary",
    },
    {
      label: "Resistência à seca",
      value: result.climateResilienceScore,
      color: "bg-[#2F80C0]",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card padding="lg" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft">
            <UserRound size={28} className="text-primary" aria-hidden />
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-lg font-bold text-text-primary">
              Dra. Amélia Mingas · Agrônoma S.O.L.O.
            </span>
            <span className="text-sm text-text-muted">
              Dados da NASA POWER + satélite SMAP, da tua terra, dos últimos
              12 meses
            </span>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-2 text-sm font-bold text-primary">
            <Satellite size={16} aria-hidden />
            Dados da NASA
          </span>
        </div>

        <p className="text-[17px] leading-relaxed text-text-primary">
          {texto}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {supported && (
            <button
              type="button"
              onClick={handleSpeak}
              className="inline-flex h-[52px] items-center gap-2.5 rounded-full bg-warm px-5 text-base font-bold text-warm-text transition-opacity hover:opacity-90"
            >
              {speaking ? (
                <Pause size={20} aria-hidden />
              ) : (
                <Play size={20} aria-hidden />
              )}
              {speaking ? "Parar de ouvir" : "Ouvir este diagnóstico"}
            </button>
          )}
        </div>
      </Card>

      <Card padding="lg" className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-bold text-text-primary">
            Como fica a tua terra com esta rotação
          </h2>
          <span className="text-base text-text-muted">
            Comparado com o que a maioria faz: {result.balance.baseline.label} e
            terra nua no resto do ano.
          </span>
        </div>

        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center">
          <ScoreRing
            value={result.overallScore}
            suffix=""
            label="Saúde da terra"
            size={150}
            tone="primary"
          />

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            {metrics.map((metric) => {
              const clamped = Math.max(0, Math.min(100, metric.value));

              return (
                <div
                  key={metric.label}
                  className="flex flex-col gap-2 rounded-input bg-surface-soft p-4"
                >
                  <span className="text-base text-text-secondary">
                    {metric.label}
                  </span>
                  <span className="text-2xl font-bold text-text-primary">
                    {clamped}%
                  </span>
                  <div
                    role="progressbar"
                    aria-valuenow={clamped}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={metric.label}
                    className="h-2.5 w-full overflow-hidden rounded-full bg-border"
                  >
                    <div
                      className={`h-full rounded-full ${metric.color} transition-[width] duration-500`}
                      style={{ width: `${clamped}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {leguminosas.length > 0 && (
        <Card padding="lg" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[22px] font-bold text-text-primary">
              As leguminosas que o servidor recomenda
            </h2>
            <span className="text-base text-text-muted">
              Fixam azoto no solo e guardam carbono — a base da rotação
              regenerativa em Angola.
            </span>
          </div>

          <ul className="flex flex-col gap-3">
            {leguminosas.map((leguminosa) => (
              <li
                key={leguminosa.nome}
                className="flex flex-col gap-1 rounded-input bg-surface-soft p-4"
              >
                <span className="text-lg font-bold text-text-primary">
                  {leguminosa.nome}{" "}
                  <span className="text-base font-normal text-text-muted">
                    ({leguminosa.nome_cientifico})
                  </span>
                </span>
                <span className="text-base text-text-secondary">
                  {leguminosa.funcao}
                </span>
                <span className="text-sm font-bold text-primary">
                  {leguminosa.taxa_sequestro_media}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center justify-between gap-4 rounded-card bg-primary p-5">
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-surface">
              Guarda isto no teu caderno da terra
            </span>
            <span className="text-base text-primary-soft">
              Fica guardado com as datas de plantio, para não te esqueceres.
            </span>
          </div>

          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-14 shrink-0 items-center gap-2.5 rounded-full bg-surface px-6 text-lg font-bold text-primary transition-opacity hover:opacity-90"
          >
            Guardar a minha rotação
            <Check size={20} aria-hidden />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSpeak}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-full px-4 text-base font-bold text-text-secondary transition-colors hover:bg-surface-soft"
        >
          <Volume2 size={18} aria-hidden />
          Ouvir de novo
        </button>
      </div>
    </div>
  );
}
