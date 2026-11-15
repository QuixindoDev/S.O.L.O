"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pause, Play, Volume2 } from "lucide-react";

/**
 * Texto que a Dona Maria ouve quando pede a explicação da página.
 * É o mesmo texto do ecrã, escrito para ser ouvido.
 */
const EXPLICACAO =
  "Eita! Parece que esse canteiro ainda não foi plantado. " +
  "Esta página não existe, ou mudou de nome. Não te preocupes: " +
  "volta para o teu Caderno da Terra e continua o teu dia. " +
  "Se quiseres, também podes voltar para a página anterior.";

/** Texto do botão "Ouvir Ajuda" do cabeçalho. */
const AJUDA =
  "Estás numa página que não existe. " +
  "Podes voltar para o teu Caderno da Terra, voltar para a página anterior, " +
  "ou ouvir a explicação desta página.";

/**
 * Leitura por voz do navegador, partilhada pelos botões da página.
 *
 * Se o telemóvel não tiver leitura por voz, levamos a Dona Maria à
 * página "Ouvir Ajuda" — nunca fica um botão que não faz nada.
 */
function useVoz() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const router = useRouter();

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

  function speak(text: string) {
    if (typeof window === "undefined") return;

    if (!supported) {
      router.push("/ouvir-ajuda");
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-PT";
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return { supported, speaking, speak };
}

/**
 * Botão "Ouvir explicação desta tela" — leitura por voz do navegador.
 */
export function OuvirExplicacao() {
  const { supported, speaking, speak } = useVoz();

  return (
    <button
      type="button"
      onClick={() => speak(EXPLICACAO)}
      aria-pressed={speaking}
      className="inline-flex h-11 items-center gap-2.5 rounded-full bg-[#f6ece6] px-6 text-base font-bold text-text-primary transition-opacity hover:opacity-90"
    >
      {supported && speaking ? (
        <Pause size={17} className="text-primary" aria-hidden />
      ) : (
        <Volume2 size={17} className="text-primary" aria-hidden />
      )}
      {supported && speaking ? "Parar de ouvir" : "Ouvir explicação desta tela"}
    </button>
  );
}

/**
 * Botão "Ouvir Ajuda" do cabeçalho — lê a ajuda da página em voz alta.
 */
export function OuvirAjuda() {
  const { supported, speaking, speak } = useVoz();

  return (
    <button
      type="button"
      onClick={() => speak(AJUDA)}
      aria-pressed={speaking}
      className="inline-flex h-12 items-center gap-2 rounded-full bg-surface-soft px-5 text-base font-bold text-text-primary transition-opacity hover:opacity-90"
    >
      <Volume2 size={16} className="text-primary" aria-hidden />
      Ouvir Ajuda
    </button>
  );
}

/**
 * "Página Anterior" — volta atrás no histórico do telemóvel.
 *
 * Se não houver histórico (a página abriu logo de fora), manda a
 * Dona Maria para o Caderno da Terra.
 */
export function PaginaAnterior() {
  function handleClick() {
    if (typeof window === "undefined") return;

    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.assign("/inicio");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-base font-bold text-text-primary transition-opacity hover:opacity-70"
    >
      <ArrowLeft size={15} aria-hidden />
      Página Anterior
    </button>
  );
}
