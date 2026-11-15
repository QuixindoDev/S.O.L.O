import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";
import {
  OuvirAjuda,
  OuvirExplicacao,
  PaginaAnterior,
} from "@/components/features/ajuda/NotFoundActions";

/**
 * Página 404 do S.O.L.O.
 *
 * Em vez da página cinzenta do servidor, a Dona Maria encontra a
 *illustration do canteiro por plantar e um caminho de volta claro:
 * o Caderno da Terra ou a página anterior. Tem também leitura por
 * voz, para quem não distingue os botões.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-bg">
      {/* Cabeçalho simples, sem menu lateral */}
      <header className="shrink-0 bg-bg">
        <div className="mx-auto flex w-full max-w-[576px] items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#00873a]">
              <Leaf size={20} className="text-[#f7fff2]" aria-hidden />
            </span>
            <span className="flex flex-col">
              <span className="text-xl font-bold text-primary">S.O.L.O.</span>
              <span className="text-[13px] text-text-secondary">
                Campo Amigo
              </span>
            </span>
          </div>

          <OuvirAjuda />
        </div>
      </header>

      <div className="flex flex-1 items-start justify-center px-4 pb-16 sm:px-6">
        <section className="flex w-full max-w-[640px] flex-col items-center gap-6 rounded-card bg-surface p-6 shadow-[0_18px_40px_-24px_rgba(31,27,23,0.35)] sm:p-10">
          {/* A ilustração: o canteiro que ainda não foi plantado */}
          <div className="flex h-[208px] w-[208px] items-center justify-center rounded-full bg-[#fcf2eb]">
            <Image
              src="/404.png"
              alt="Uma agrónoma com um vaso de planta e o número 404 desenhado com uma folha"
              width={222}
              height={285}
              priority
              className="h-[196px] w-auto"
            />
          </div>

          <h1 className="max-w-[460px] text-center text-[30px] font-bold leading-tight text-text-primary sm:text-[38px]">
            Eita! Parece que esse canteiro ainda não foi plantado.
          </h1>

          <OuvirExplicacao />

          <div className="h-px w-full max-w-[544px] bg-[#f0e6e0]" />

          <div className="flex w-full max-w-[544px] flex-wrap items-center justify-between gap-4">
            <Link
              href="/inicio"
              className="inline-flex h-12 items-center gap-2.5 rounded-[8px] bg-primary px-6 text-lg font-bold text-white transition-opacity hover:opacity-90"
            >
              Voltar para meu Caderno
              <ArrowRight size={18} aria-hidden />
            </Link>

            <PaginaAnterior />
          </div>
        </section>
      </div>
    </main>
  );
}
