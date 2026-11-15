"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  Check,
  CornerDownLeft,
  Lock,
  MapPin,
  User,
  UserRound,
} from "lucide-react";
import { Button, Field, Input, StatusMessage } from "@/components/ui";
import { registar } from "@/lib/api";
import { primeiroErro, validarRegisto, type FieldErrors } from "@/lib/validation";
import type { RegisterPayload } from "@/types/api";

/** Estado da faixa de retorno: `null` = ainda não há mensagem para mostrar. */
type Status = { success: boolean; message: string } | null;

export function CriarContaForm() {
  // Os campos do formulário, já agrupados no objecto que vai para a API.
  const [form, setForm] = useState<RegisterPayload>({
    nome: "",
    telefone: "",
    cidade: "",
    senha: "",
  });

  /** Erro **por campo** — cada mensagem vive no seu campo. */
  const [erros, setErros] = useState<FieldErrors<RegisterPayload>>({});
  /** Erro ou sucesso **do conjunto** da operação (servidor, rede). */
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);

  // Referências para levar o foco do teclado ao primeiro campo com erro.
  const refs = {
    nome: useRef<HTMLInputElement>(null),
    telefone: useRef<HTMLInputElement>(null),
    cidade: useRef<HTMLInputElement>(null),
    senha: useRef<HTMLInputElement>(null),
  };

  /** Actualiza um campo, limpa o erro dele e esconde a faixa global. */
  const update =
    (campo: keyof RegisterPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [campo]: e.target.value }));
      setErros((prev) => {
        if (!prev[campo]) return prev;
        const copia = { ...prev };
        delete copia[campo];
        return copia;
      });
      setStatus(null);
    };

  const handlerRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Validação — erros isolados por campo.
    const errosCampos = validarRegisto(form);
    setErros(errosCampos);

    if (Object.keys(errosCampos).length > 0) {
      // Leva o foco ao primeiro campo com erro — não obriga o produtor a procurar.
      const primeiro = primeiroErro(errosCampos);
      if (primeiro) refs[primeiro].current?.focus();
      return;
    }

    // 2. Envio ao servidor.
    setLoading(true);
    setStatus(null);

    try {
      const resposta = await registar({
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        cidade: form.cidade.trim(),
        senha: form.senha,
      });

      setStatus({ success: resposta.success, message: resposta.message });
    } catch (erro) {
      // Erro de rede/servidor: aqui sim é uma faixa global, porque não
      // pertence a nenhum campo em concreto.
      setStatus({
        success: false,
        message:
          erro instanceof Error
            ? erro.message
            : "Não foi possível criar a conta agora. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex w-full flex-col items-start gap-6" onSubmit={handlerRegister}>
      <Field
        id="nome"
        label="Como você quer ser chamada?"
        icon={User}
        hint="Pode ser seu nome, apelido carinhoso ou nome do sítio."
        error={erros.nome}
      >
        <Input
          id="nome"
          name="nome"
          ref={refs.nome}
          placeholder="Ex: Dona Maria da Silva ou Sítio Esperança"
          autoComplete="name"
          value={form.nome}
          onChange={update("nome")}
          error={erros.nome}
        />
      </Field>

      <Field
        id="telefone"
        label="Seu WhatsApp ou Celular"
        icon={UserRound}
        hint="Usado para você receber os alertas do tempo, de forma simples."
        error={erros.telefone}
      >
        <Input
          id="telefone"
          name="telefone"
          ref={refs.telefone}
          type="tel"
          inputMode="tel"
          placeholder="Ex: (+244) 923 456 789"
          autoComplete="tel"
          value={form.telefone}
          onChange={update("telefone")}
          error={erros.telefone}
        />
      </Field>

      <Field
        id="cidade"
        label="Sua Cidade e Estado"
        icon={MapPin}
        hint="Para mostrarmos se vai fazer sol forte ou chover na sua terra."
        error={erros.cidade}
      >
        <Input
          id="cidade"
          name="cidade"
          ref={refs.cidade}
          placeholder="Ex: Caxito - Bengo"
          autoComplete="address-level2"
          value={form.cidade}
          onChange={update("cidade")}
          error={erros.cidade}
        />
      </Field>

      <Field
        id="senha"
        label="Crie uma Senha Simples"
        icon={Lock}
        hint="Escolha algo que você lembre sem esforço no dia a dia."
        error={erros.senha}
      >
        <Input
          id="senha"
          name="senha"
          ref={refs.senha}
          type="password"
          placeholder="Uma palavra ou números fáceis"
          autoComplete="new-password"
          value={form.senha}
          onChange={update("senha")}
          error={erros.senha}
        />
      </Field>

      {/* Faixa global — só para o resultado da operação (sucesso ou falha do servidor). */}
      {status && (
        <StatusMessage success={status.success} message={status.message} />
      )}

      <Button type="submit" size="lg" fullWidth icon={Check} disabled={loading}>
        {loading ? "A CRIAR A SUA CONTA..." : "CRIAR MINHA CONTA E COMEÇAR"}
      </Button>

      <div className="flex w-full items-center justify-center">
        <Link
          href="/entrar"
          className="inline-flex items-center gap-2 rounded-[4px] text-[18px] font-bold text-primary hover:underline"
        >
          <CornerDownLeft size={20} aria-hidden="true" />
          Já tem uma conta? Entrar
        </Link>
      </div>
    </form>
  );
}
