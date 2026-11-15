"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Coins, Leaf, Satellite, TrendingUp, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { CartaoRendaCarbono } from "@/components/features/renda/CartaoRendaCarbono";
import { DialogoRegistarMetodo } from "@/components/features/renda/DialogoRegistarMetodo";
import { DialogoSacar } from "@/components/features/renda/DialogoSacar";
import {
  calcularRendaCarbono,
  formatarKz,
  formatarTco2e,
  PRECO_POR_TONELADA_KZ,
} from "@/lib/carbono";
import { defaultFarm } from "@/lib/farm";
import { cropById, defaultPlantings, loadSavedRotation, type Planting } from "@/lib/plantio";
import { ROTATION_PLANS } from "@/lib/rotacao";
import type { DiagnosticoDto } from "@/lib/api/types";
import {
  addSaque,
  descreverMetodo,
  loadMetodoSaque,
  loadSaques,
  totalSacado,
  type MetodoSaque,
  type Saque,
} from "@/lib/saques";

export interface RendaCarbonoProps {
  /** Área da terra em hectares (vem do perfil no back-end). */
  areaHectares?: number;
  /** "Huambo - Huíla" — para a barra lateral. */
  locationLabel?: string;
  /** Diagnóstico oficial devolvido pelo back-end (POST /api/v1/analyze). */
  analiseServidor?: DiagnosticoDto | null;
}

/**
 * Ecrã 9 — "A Renda da Minha Terra".
 *
 * O carbono que a rotação guarda no solo é o que a Dona Maria pode
 * levantar. O ecrã diz, em três frases: quanto a terra ganhou, quanto
 * pode sacar agora e onde é que o dinheiro vai.
 */
export function RendaCarbono({
  areaHectares = defaultFarm.areaHectares,
  locationLabel = defaultFarm.locationLabel,
  analiseServidor = null,
}: RendaCarbonoProps) {
  const [plantings, setPlantings] = useState<Planting[]>(() =>
    defaultPlantings([...ROTATION_PLANS[0].crops]),
  );
  const [saques, setSaques] = useState<Saque[]>([]);
  const [metodo, setMetodo] = useState<MetodoSaque | null>(null);
  const [dialogoMetodo, setDialogoMetodo] = useState(false);
  const [dialogoSaque, setDialogoSaque] = useState(false);

  // A rotação guardada no ecrã Rotação de Culturas / Calendário.
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

  const jaSacado = totalSacado(saques);
  const disponivel = Math.max(0, resumo.rendaKz - jaSacado);

  // Os últimos 4 meses com carbono (até ao mês corrente).
  const mesesRecentes = useMemo(() => {
    const agora = new Date().getMonth();
    const meses: number[] = [];
    for (let i = 3; i >= 0; i--) {
      const mes = (agora - i + 12) % 12;
      meses.push(mes);
    }
    return meses.map((mes) => resumo.porMes[mes]);
  }, [resumo]);

  function confirmarSaque() {
    if (disponivel <= 0 || !metodo) return;
    const lista = addSaque({
      kz: disponivel,
      metodo: descreverMetodo(metodo),
    });
    setSaques(lista);
    setDialogoSaque(false);
  }

  return (
    <AppShell
      title="A Renda da Minha Terra"
      subtitle="O carbono que a tua terra produz"
      location={locationLabel}
    >
      <div className="flex flex-col gap-6">
        {/* Quanto a terra ganhou */}
        <Card padding="lg" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-[22px] font-bold text-text-primary sm:text-2xl">
                Quanto a tua terra ganhou este ano
              </h2>
              <span className="text-base text-text-muted">
                Calculado com os dados da NASA e com a rotação que estás a
                fazer.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setDialogoMetodo(true)}
              className="inline-flex h-[34px] items-center gap-2 rounded-full bg-primary-soft px-3.5 text-sm font-bold text-primary transition-opacity hover:opacity-80"
            >
              <Wallet size={16} aria-hidden />
              Registar saque
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={Coins}
              label="Renda gerada"
              value={formatarKz(resumo.rendaKz)}
              note="neste ano"
            />
            <StatCard
              icon={Leaf}
              label="Carbono captado"
              value={formatarTco2e(resumo.tco2eBruto)}
              note={`em ${resumo.areaHa.toLocaleString("pt-PT")} hectares`}
            />
            <StatCard
              icon={TrendingUp}
              label="Preço por tonelada"
              value={formatarKz(PRECO_POR_TONELADA_KZ)}
              note="mercado de carbono"
            />
          </div>
        </Card>

        {/* O que o servidor calculou a partir dos dados de satélite */}
        {analiseServidor && (
          <Card padding="lg" className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-[22px] font-bold text-text-primary sm:text-2xl">
                Diagnóstico do servidor
              </h2>
              <span className="text-base text-text-muted">
                Cruzamento da tua terra com os dados de satélite da NASA.
              </span>
            </div>

            <p className="text-base leading-snug text-text-secondary">
              Solo classificado como{" "}
              <strong className="text-text-primary">
                {analiseServidor.analise_solo.classificacao_saude}
              </strong>{" "}
              ({analiseServidor.analise_solo.score_saude}/100), com rotação
              recomendada de{" "}
              <strong className="text-text-primary">
                {analiseServidor.rotacao_principal.cultura_recomendada}
              </strong>
              .
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={Leaf}
                label="Créditos líquidos"
                value={`${analiseServidor.estimativa_carbono.creditos_liquidos_tco2e.toFixed(1)} tCO₂e`}
                note={`margem de segurança de ${Math.round(analiseServidor.estimativa_carbono.margem_seguranca * 100)}%`}
              />
              <StatCard
                icon={TrendingUp}
                label="Valor de mercado"
                value={`US$ ${analiseServidor.estimativa_carbono.valor_estimado_usd.toFixed(0)}`}
                note={`a US$ ${analiseServidor.estimativa_carbono.preco_por_credito_usd.toFixed(2)} por tCO₂e`}
              />
              <StatCard
                icon={Satellite}
                label="Fonte dos dados"
                value={analiseServidor.metricas_satelite.fonte_dados}
                note={`NDVI ${analiseServidor.metricas_satelite.ndvi}`}
              />
            </div>
          </Card>
        )}

        {/* Quanto pode sacar agora */}
        <CartaoRendaCarbono
          onSacar={() => setDialogoSaque(true)}
          areaHectares={areaHectares}
        />

        {/* Mês a mês */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text-primary">
            O carbono da tua terra, mês a mês
          </h2>

          <Card padding="lg" className="flex flex-col gap-4">
            {mesesRecentes.map((mes) => (
              <div
                key={mes.mes}
                className="flex items-center gap-3 sm:gap-4"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary-soft text-primary"
                  aria-hidden
                >
                  <Leaf size={22} />
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[17px] font-bold text-text-primary">
                    {mes.nome}
                  </span>
                  <span className="text-sm leading-snug text-text-muted">
                    {mes.descricao}
                  </span>
                  <span className="text-sm font-bold text-text-secondary">
                    {formatarTco2e(mes.tco2e)}
                  </span>
                </span>

                <span className="shrink-0 text-xl font-bold text-primary">
                  {formatarKz(mes.kz)}
                </span>
              </div>
            ))}
          </Card>
        </div>

        {/* Como isto funciona */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text-primary">
            Como isto funciona
          </h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ExplicaCard
              icone={Leaf}
              titulo="A terra cobre-se"
              texto="Com Braquiária e Crotalária, o solo fica coberto o ano inteiro e o carbono do ar fica preso na terra."
            />
            <ExplicaCard
              icone={TrendingUp}
              titulo="A NASA mede"
              texto="O satélite SMAP vê, de cima, a cobertura e a humidade da tua terra — sem guesses, com medições."
            />
            <ExplicaCard
              icone={Coins}
              titulo="Tu recebes"
              texto={`Cada tonelada de carbono vale ${formatarKz(
                PRECO_POR_TONELADA_KZ,
              )}. Fica guardada e podes sacá-la quando quiseres.`}
            />
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-4 rounded-card bg-surface-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex flex-col gap-1">
            <span className="text-lg font-bold text-text-primary">
              Queres ganhar mais?
            </span>
            <span className="text-base text-text-secondary">
              Terra sempre coberta = mais carbono guardado = mais renda. Vê a
              tua rotação.
            </span>
          </span>

          <Link
            href="/rotacao-de-culturas"
            className="inline-flex h-13 shrink-0 items-center gap-2.5 rounded-full bg-primary px-6 text-lg font-bold text-white transition-opacity hover:opacity-90"
          >
            Ver a minha rotação
            <ArrowRight size={20} aria-hidden />
          </Link>
        </div>
      </div>

      <DialogoRegistarMetodo
        open={dialogoMetodo}
        onClose={() => setDialogoMetodo(false)}
        onGuardado={(guardado) => setMetodo(guardado)}
      />

      <DialogoSacar
        open={dialogoSaque}
        disponivelKz={disponivel}
        metodo={metodo}
        onClose={() => setDialogoSaque(false)}
        onConfirmar={confirmarSaque}
        onRegistarMetodo={() => setDialogoMetodo(true)}
      />
    </AppShell>
  );
}

/** Uma métrica do resumo. */
function StatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-input bg-surface-soft p-5">
      <span className="flex items-center gap-2 text-base text-text-secondary">
        <Icon size={20} className="text-primary" aria-hidden />
        {label}
      </span>
      <span className="text-3xl font-bold text-text-primary">{value}</span>
      <span className="text-sm text-text-muted">{note}</span>
    </div>
  );
}

/** Um passo de "como isto funciona". */
function ExplicaCard({
  icone: Icon,
  titulo,
  texto,
}: {
  icone: typeof Coins;
  titulo: string;
  texto: string;
}) {
  return (
    <Card padding="md" className="flex flex-col gap-3">
      <span className="flex items-center gap-3">
        <span
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] bg-primary-soft"
          aria-hidden
        >
          <Icon size={24} className="text-primary" />
        </span>
        <span className="text-lg font-bold text-text-primary">{titulo}</span>
      </span>
      <span className="text-base leading-snug text-text-secondary">
        {texto}
      </span>
    </Card>
  );
}
