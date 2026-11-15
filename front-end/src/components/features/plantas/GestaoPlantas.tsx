"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { HarvestCard } from "@/components/features/plantas/HarvestCard";
import { PlantList } from "@/components/features/plantas/PlantList";
import { api } from "@/lib/api/endpoints";
import { readSessionToken } from "@/lib/api/session";
import type { HarvestDto, PlantDto, PlotDto } from "@/lib/api/types";

export interface GestaoPlantasProps {
  plants: PlantDto[];
  harvests: HarvestDto[];
  plots: PlotDto[];
}

const STATUS_PLANTAS = [
  { value: "Crescendo", label: "Crescendo" },
  { value: "Florindo", label: "Florindo" },
  { value: "Pronta", label: "Pronta para colher" },
  { value: "Com sede", label: "Com sede" },
  { value: "Cortando", label: "Cortando" },
];

const ICONES_PLANTAS = [
  { value: "sprout", label: "Ramo" },
  { value: "leaf", label: "Folha" },
  { value: "bean", label: "Feijão" },
  { value: "carrot", label: "Cenoura" },
];

const DESTINOS_COLHEITA = [
  { value: "feira", label: "Vendido na feira" },
  { value: "casa", label: "Levado para casa" },
  { value: "cooperativa", label: "Cooperativa" },
];

/**
 * Ecrã 8 — "Minhas Plantas" (com escrita no servidor).
 *
 * Os dados chegam do back-end (Server Component); aqui ficam os
 * formulários que criam plantas e colheitas:
 *   POST /api/v1/plants
 *   POST /api/v1/harvests
 */
export function GestaoPlantas({ plants, harvests, plots }: GestaoPlantasProps) {
  const router = useRouter();

  const [dialogoPlanta, setDialogoPlanta] = useState(false);
  const [dialogoColheita, setDialogoColheita] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  // Formulário da nova planta
  const [nome, setNome] = useState("");
  const [canteiro, setCanteiro] = useState(plots[0]?.id ?? "");
  const [status, setStatus] = useState("Crescendo");
  const [icone, setIcone] = useState("sprout");
  const [cuidados, setCuidados] = useState("");
  const [dias, setDias] = useState("");

  // Formulário da nova colheita
  const [cultura, setCultura] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [destino, setDestino] = useState("feira");

  async function guardarPlanta() {
    if (!nome.trim()) {
      setErro("Escreve o nome da planta.");
      return;
    }

    setAGuardar(true);
    setErro(null);

    try {
      await api.plants.create(
        {
          name: nome.trim(),
          plotId: canteiro || plots[0]?.id || "",
          icon: icone,
          status,
          care: cuidados.trim() || undefined,
          harvestInDays: Number(dias) || 0,
          sowingDate: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
        },
        { token: readSessionToken() },
      );

      setDialogoPlanta(false);
      setNome("");
      setCuidados("");
      setDias("");
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível guardar a planta.",
      );
    } finally {
      setAGuardar(false);
    }
  }

  async function guardarColheita() {
    if (!cultura.trim() || !quantidade.trim()) {
      setErro("Preenche a cultura e a quantidade colhida.");
      return;
    }

    setAGuardar(true);
    setErro(null);

    try {
      await api.harvests.create(
        {
          crop: cultura.trim(),
          quantity: quantidade.trim(),
          soldAt: destino,
          date: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
        },
        { token: readSessionToken() },
      );

      setDialogoColheita(false);
      setCultura("");
      setQuantidade("");
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível guardar a colheita.",
      );
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button
          variant="soft"
          icon={ShoppingBasket}
          onClick={() => setDialogoColheita(true)}
        >
          Registar colheita
        </Button>
      </div>

      {/* Minhas plantas — cards com foto por cima da lista */}
      <PlantList plants={plants} plots={plots} onAdd={() => setDialogoPlanta(true)} />

      {/* Nova planta */}
      <Dialog
        open={dialogoPlanta}
        onClose={() => setDialogoPlanta(false)}
        title="Nova planta"
        description="Regista o que acabaste de semear num canteiro."
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Nome da planta"
            placeholder="Ex: Tomate Cereja"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            required
          />

          <Select
            label="Canteiro"
            value={canteiro}
            onChange={setCanteiro}
            options={plots.map((plot) => ({
              value: plot.id,
              label: plot.name,
            }))}
          />

          <Select
            label="Estado"
            value={status}
            onChange={setStatus}
            options={STATUS_PLANTAS}
          />

          <Select
            label="Ícone"
            value={icone}
            onChange={setIcone}
            options={ICONES_PLANTAS}
          />

          <Field
            label="Cuidados"
            placeholder="Ex: Precisa de estaca agora"
            value={cuidados}
            onChange={(event) => setCuidados(event.target.value)}
          />

          <Field
            label="Dias até à colheita"
            placeholder="Ex: 12"
            type="number"
            value={dias}
            onChange={(event) => setDias(event.target.value)}
          />

          {erro && (
            <p role="alert" className="text-base font-bold text-danger">
              {erro}
            </p>
          )}

          <Button
            icon={Plus}
            onClick={guardarPlanta}
            disabled={aGuardar}
            fullWidth
          >
            {aGuardar ? "A guardar…" : "Guardar planta"}
          </Button>
        </div>
      </Dialog>

      {/* Nova colheita */}
      <Dialog
        open={dialogoColheita}
        onClose={() => setDialogoColheita(false)}
        title="Registar colheita"
        description="O que colheste e para onde foi."
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Cultura"
            placeholder="Ex: Alface"
            value={cultura}
            onChange={(event) => setCultura(event.target.value)}
            required
          />

          <Field
            label="Quantidade"
            placeholder="Ex: 12 cabeças"
            value={quantidade}
            onChange={(event) => setQuantidade(event.target.value)}
            required
          />

          <Select
            label="Destino"
            value={destino}
            onChange={setDestino}
            options={DESTINOS_COLHEITA}
          />

          {erro && (
            <p role="alert" className="text-base font-bold text-danger">
              {erro}
            </p>
          )}

          <Button
            icon={ShoppingBasket}
            onClick={guardarColheita}
            disabled={aGuardar}
            fullWidth
          >
            {aGuardar ? "A guardar…" : "Guardar colheita"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
