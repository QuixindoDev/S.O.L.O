"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Lock, LogIn, Smartphone, UserPlus } from "lucide-react";
import { Button, Field, Input, StatusMessage } from "@/components/ui";
import { entrar } from "@/lib/api";
import { primeiroErro, validarLogin, type FieldErrors } from "@/lib/validation";
import type { LoginPayload } from "@/types/api";

/** Estado da faixa de retorno: `null` = ainda não há mensagem para mostrar. */
type Status = { success: boolean; message: string } | null;

export function EntrarForm() {
  // Os campos do formulário, já agrupados no objecto que vai para a API.
  const [form, setForm] = useState<LoginPayload>({
    telefone: "",
    senha: "",
  });

  /** Erro **por campo** — cada mensagem vive no seu campo. */
  const [erros, setErros] = useState<FieldErrors<LoginPayload>>({});
  /** Erro ou sucesso **do conjunto** da operação (servidor, rede). */
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);

  // Referências para levar o foco do teclado ao primeiro campo com erro.
  const refs = {
    telefone: useRef<HTMLInputElement>(null),
    senha: useRef<HTMLInputElement>(null),
  };

  /** Actualiza um campo, limpa o erro dele e esconde a faixa global. */
  const update =
    (campo: keyof LoginPayload) =>
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

  const handlerLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Validação — erros isolados por campo.
    const errosCampos = validarLogin(form);
    setErros(errosCampos);

    if (Object.keys(errosCampos).length > 0) {
      const primeiro = primeiroErro(errosCampos);
      if (primeiro) refs[primeiro].current?.focus();
      return;
    }

    // 2. Envio ao servidor.
    setLoading(true);
    setStatus(null);

    try {
      const resposta = await entrar({
        telefone: form.telefone.trim(),
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
            : "Não foi possível entrar. O número ou a senha podem estar errados.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex w-full flex-col items-start gap-6" onSubmit={handlerLogin}>
      <Field
        id="telefone"
        label="Seu WhatsApp ou Celular"
        icon={Smartphone}
        hint="O mesmo número que você usou para criar a conta."
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
        id="senha"
        label="Sua Senha"
        icon={Lock}
        hint="Se não lembrar, a gente ajuda pelo WhatsApp."
        error={erros.senha}
      >
        <Input
          id="senha"
          name="senha"
          ref={refs.senha}
          type="password"
          placeholder="Digite sua senha"
          autoComplete="current-password"
          value={form.senha}
          onChange={update("senha")}
          error={erros.senha}
        />
      </Field>

      {/* Faixa global — só para o resultado da operação (sucesso ou falha do servidor). */}
      {status && (
        <StatusMessage success={status.success} message={status.message} />
      )}

      <Button type="submit" size="lg" fullWidth icon={LogIn} disabled={loading}>
        {loading ? "A ENTRAR..." : "ENTRAR NO MEU CADERNO"}
      </Button>

      <div className="flex w-full items-center justify-center">
        <Link
          href="/criar-conta"
          className="inline-flex items-center gap-2 rounded-[4px] text-[18px] font-bold text-primary hover:underline"
        >
          <UserPlus size={20} aria-hidden="true" />
          Ainda não tenho conta. Criar agora
        </Link>
      </div>
    </form>
  );
}
