import React from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { defaultFarm } from "@/lib/farm";

/**
 * Perfil do agricultor — servido em `profile.agrosolo.earth`.
 *
 * O rewrite por subdomínio está em `next.config.mjs`.
 */
export default function ProfilePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <Card padding="lg" className="flex w-full max-w-lg flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warm">
          <UserRound size={36} className="text-warm-text" aria-hidden />
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-text-primary">
            {defaultFarm.userName}
          </h1>
          <p className="text-lg text-text-secondary">{defaultFarm.farmName}</p>
        </div>

        <Avatar initials={defaultFarm.initials} size="lg" />

        <dl className="flex w-full flex-col gap-3 text-left">
          <div className="flex flex-col gap-0.5">
            <dt className="text-sm text-text-muted">Localidade</dt>
            <dd className="text-lg font-bold text-text-primary">
              {defaultFarm.city} - {defaultFarm.state}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-sm text-text-muted">Coordenadas</dt>
            <dd className="text-lg font-bold text-text-primary">
              {defaultFarm.latitude}°, {defaultFarm.longitude}°
            </dd>
          </div>
        </dl>

        <p className="text-base text-text-muted">
          Servido no subdomínio{" "}
          <strong className="text-text-secondary">profile.agrosolo.earth</strong>.
        </p>

        <Link
          href="/inicio"
          className="inline-flex h-14 items-center justify-center rounded-input bg-primary px-6 text-lg font-bold text-white transition-colors hover:bg-primary-hover"
        >
          Voltar ao app
        </Link>
      </Card>
    </main>
  );
}
