import React from "react";
import Link from "next/link";
import {
  CloudSun,
  Home,
  Leaf,
  SearchX,
  Sprout,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconBox } from "@/components/ui/IconBox";

/**
 * Página 404 do S.O.L.O.
 *
 * Em vez da página cinzenta da Vercel, a Dona Maria recebe uma
 * explicação simples em português e atalhos para onde quer ir.
 * Sem jargão, sem códigos de erro.
 */
export default function NotFound() {
  // Só entram aqui páginas que já existem — um atalho que leva a outro
  // 404 seria o pior dos mundos.
  const atalhos = [
    {
      href: "/inicio",
      label: "Meu Caderno da Terra",
      description: "O resumo do seu dia",
      icon: Home,
    },
    {
      href: "/previsao-do-tempo",
      label: "Previsão do Tempo",
      description: "Sol, chuva e mais 7 dias",
      icon: CloudSun,
    },
    {
      href: "/minha-terra-e-horta",
      label: "Minha Terra e Horta",
      description: "Como está o solo e o que plantar",
      icon: Sprout,
    },
    {
      href: "/minhas-plantas",
      label: "Minhas Plantas",
      description: "O que está plantado",
      icon: Leaf,
    },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-bg">
      {/* Barra simples, sem menu lateral */}
      <header className="flex shrink-0 items-center gap-3.5 border-b border-border bg-surface px-6 py-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-input bg-primary">
          <SearchX size={22} className="text-white" aria-hidden />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-primary">S.O.L.O.</span>
          <span className="text-sm text-text-muted">Campo Amigo</span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <Card padding="lg" className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
          {/* Número + ilustração */}
          <div className="relative flex items-center justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-soft">
              <SearchX size={48} className="text-primary" aria-hidden />
            </div>
            <span className="absolute -right-2 -bottom-2 rounded-full bg-primary px-3 py-1 text-lg font-bold text-white">
              404
            </span>
          </div>

          {/* Mensagem */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
              Não encontrámos esta página
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-text-secondary">
              O endereço que abriu não existe, ou mudou de nome. Não se
              preocupe — escolha abaixo onde quer ir.
            </p>
          </div>

          {/* Acções principais */}
          <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button href="/inicio" icon={Home} size="lg">
              Voltar ao início
            </Button>
            <Button
              href="/previsao-do-tempo"
              variant="soft"
              icon={CloudSun}
              size="lg"
            >
              Ver o tempo de hoje
            </Button>
          </div>

          {/* Atalhos para as secções */}
          <div className="flex w-full flex-col gap-3 border-t border-border pt-6">
            <span className="text-sm font-bold tracking-wider text-text-muted">
              OU VÁ DIRECTAMENTE A
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {atalhos.map((atalho) => {
                const Icon = atalho.icon;
                return (
                  <Link
                    key={atalho.href}
                    href={atalho.href}
                    className="flex items-center gap-3.5 rounded-input bg-surface-soft p-4 text-left transition-colors hover:bg-primary-soft"
                  >
                    <IconBox icon={Icon} tone="surface" size="sm" />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-base font-bold text-text-primary">
                        {atalho.label}
                      </span>
                      <span className="text-sm text-text-muted">
                        {atalho.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quando o ecrã 11 (Falar com a Agrônoma) existir, o atalho
              para o WhatsApp entra aqui — em `atalhos` ou nesta nota. */}
        </Card>
      </div>
    </main>
  );
}
