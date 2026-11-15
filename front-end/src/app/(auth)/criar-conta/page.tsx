import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  CornerDownLeft,
  Lock,
  MapPin,
  ShieldCheck,
  Sprout,
  User,
  UserRound,
} from "lucide-react";
import { AuthHero } from "@/components/features/auth/AuthHero";
import { Button, Callout, Card, Field, Input } from "@/components/ui";

export const metadata: Metadata = {
  title: "Criar sua Conta Grátis | S.O.L.O.",
  description:
    "Crie a sua conta do S.O.L.O. Campo Amigo em menos de 1 minuto.",
};

export default function CriarContaPage() {
  return (
    <Card padding="lg" className="max-w-[600px] gap-7">
      <AuthHero
        icon={Sprout}
        title="Criar sua Conta Grátis"
        subtitle="Leva menos de 1 minuto para começar a cuidar da sua horta e lavoura."
      />

      <form className="flex w-full flex-col items-start gap-6">
        <Field
          id="nome"
          label="Como você quer ser chamada?"
          icon={User}
          hint="Pode ser seu nome, apelido carinhoso ou nome do sítio."
        >
          <Input
            id="nome"
            name="nome"
            placeholder="Ex: Dona Maria da Silva ou Sítio Esperança"
            autoComplete="name"
          />
        </Field>

        <Field
          id="telefone"
          label="Seu WhatsApp ou Celular"
          icon={UserRound}
          hint="Usado para você receber os alertas do tempo, de forma simples."
        >
          <Input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            placeholder="Ex: (+244) 923 456 789"
            autoComplete="tel"
          />
        </Field>

        <Field
          id="cidade"
          label="Sua Cidade e Estado"
          icon={MapPin}
          hint="Para mostrarmos se vai fazer sol forte ou chover na sua terra."
        >
          <Input
            id="cidade"
            name="cidade"
            placeholder="Ex: Caxito - Bengo"
            autoComplete="address-level2"
          />
        </Field>

        <Field
          id="senha"
          label="Crie uma Senha Simples"
          icon={Lock}
          hint="Escolha algo que você lembre sem esforço no dia a dia."
        >
          <Input
            id="senha"
            name="senha"
            type="password"
            placeholder="Uma palavra ou números fáceis"
            autoComplete="new-password"
          />
        </Field>

        <Button type="submit" size="lg" fullWidth icon={Check}>
          CRIAR MINHA CONTA E COMEÇAR
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

      <Callout
        variant="note"
        icon={ShieldCheck}
        description="Seus dados estão protegidos com carinho. Não cobramos nada."
      />
    </Card>
  );
}
