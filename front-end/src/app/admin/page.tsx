import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

/**
 * Área de administração — servida em `admin.agrosolo.earth`.
 *
 * O rewrite por subdomínio está em `next.config.mjs`.
 * O URL público continua a ser `admin.agrosolo.earth`, mas por dentro
 * esta rota vive em `/admin`.
 */
export default function AdminPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-lg rounded-card border border-border bg-surface p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
          <ShieldCheck size={30} className="text-primary" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">
          Área de administração
        </h1>
        <p className="mt-2 text-lg text-text-secondary">
          Este ecrã é servido no subdomínio{" "}
          <strong className="text-text-primary">admin.agrosolo.earth</strong>.
        </p>
        <p className="mt-4 text-base text-text-muted">
          O rewrite é feito em <code>next.config.mjs</code> — por dentro a rota
          continua a ser <code>/admin</code>.
        </p>
        <Link
          href="/inicio"
          className="mt-6 inline-flex h-14 items-center justify-center rounded-input bg-primary px-6 text-lg font-bold text-white transition-colors hover:bg-primary-hover"
        >
          Voltar ao app
        </Link>
      </div>
    </main>
  );
}
