import React from "react";
import Link from "next/link";
import { Activity, ShieldCheck, Sprout, TriangleAlert } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { getServerToken } from "@/lib/api/server";
import type { DiagnosticoDto, FarmerDto } from "@/lib/api/types";

/**
 * Área de administração — servida em `admin.agrosolo.earth`.
 *
 * O rewrite por subdomínio está em `next.config.mjs`.
 * O URL público continua a ser `admin.agrosolo.earth`, mas por dentro
 * esta rota vive em `/admin`.
 *
 * Os dados vêm do back-end Field Shift:
 *   GET /api/v1/farmers   — Agricultores registados
 *   GET /api/v1/analyses  — Diagnósticos de terra
 *   GET /health           — Estado do servidor
 */
export const revalidate = 60;

export default async function AdminPage() {
  const token = await getServerToken();

  const [farmers, analyses, health] = await Promise.all([
    api.farmers
      .list({ limit: 20, include_inactive: true }, { token, revalidate: 60 })
      .catch(() => [] as FarmerDto[]),
    api.analyses
      .list({ token, revalidate: 60 })
      .catch(() => [] as DiagnosticoDto[]),
    api.health({ revalidate: 60 }).catch(() => null),
  ]);

  const activos = farmers.filter((f) => f.is_active).length;

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-bg px-6 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
            <ShieldCheck size={30} className="text-primary" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Área de administração
          </h1>
          <p className="text-base text-text-secondary">
            Este ecrã é servido no subdomínio{" "}
            <strong className="text-text-primary">admin.agrosolo.earth</strong>.
          </p>
        </header>

        {/* Estado do back-end */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={Activity}
            label="Estado do servidor"
            value={health?.status ?? "sem resposta"}
            note={health ? health.satelite_adapter : "back-end desligado"}
          />
          <StatCard
            icon={Sprout}
            label="Agricultores"
            value={String(farmers.length)}
            note={`${activos} activos`}
          />
          <StatCard
            icon={TriangleAlert}
            label="Análises de terra"
            value={String(analyses.length)}
            note="diagnósticos guardados"
          />
        </section>

        {/* Agricultores */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-text-primary">
            Agricultores registados
          </h2>

          {farmers.length === 0 ? (
            <p className="rounded-card border border-border bg-surface px-5 py-4 text-base text-text-muted">
              Ainda não há agricultores registados no servidor.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {farmers.map((farmer) => (
                <li
                  key={farmer.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface px-5 py-4"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-lg font-bold text-text-primary">
                      {farmer.nome_completo}
                    </span>
                    <span className="text-sm text-text-muted">
                      {farmer.telefone}
                      {farmer.cooperativa ? ` · ${farmer.cooperativa}` : ""}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-text-secondary">
                    {farmer.is_active ? "Activo" : "Desativado"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Análises */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-text-primary">
            Últimas análises de terra
          </h2>

          {analyses.length === 0 ? (
            <p className="rounded-card border border-border bg-surface px-5 py-4 text-base text-text-muted">
              Ainda não há análises de terra registadas.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {analyses.slice(0, 10).map((analise) => (
                <li
                  key={analise.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface px-5 py-4"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-lg font-bold text-text-primary">
                      {analise.fazenda.nome ?? "Terra sem nome"} ·{" "}
                      {analise.fazenda.cultura_atual}
                    </span>
                    <span className="text-sm text-text-muted">
                      Solo {analise.analise_solo.classificacao_saude} ·{" "}
                      {analise.estimativa_carbono.creditos_liquidos_tco2e.toFixed(1)}{" "}
                      tCO₂e
                    </span>
                  </div>
                  <span className="text-sm text-text-muted">
                    {analise.gerado_em?.slice(0, 10)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link
          href="/inicio"
          className="inline-flex h-14 items-center justify-center rounded-input bg-primary px-6 text-lg font-bold text-white transition-colors hover:bg-primary-hover"
        >
          Voltar ao app
        </Link>
      </div>
    </main>
  );
}

/** Um número do resumo. */
function StatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-5">
      <span className="flex items-center gap-2 text-base text-text-secondary">
        <Icon size={20} className="text-primary" aria-hidden />
        {label}
      </span>
      <span className="text-2xl font-bold text-text-primary">{value}</span>
      <span className="text-sm text-text-muted">{note}</span>
    </div>
  );
}
