import type { Metadata } from "next";
import Link from "next/link";
import { Lock, LogIn, PhoneCall, Smartphone, UserPlus, UserRound } from "lucide-react";
import { AuthHero } from "@/components/features/auth/AuthHero";
import { Button, Callout, Card, Field, Input } from "@/components/ui";

export const metadata: Metadata = {
  title: "Entrar na minha conta | S.O.L.O.",
  description: "Entre no seu caderno da terra do S.O.L.O. Campo Amigo.",
};

export default function EntrarPage() {
  return (
    <Card padding="lg" className="max-w-[600px] gap-7">
      <AuthHero
        icon={UserRound}
        title="Entrar na minha conta"
        subtitle="Bom te ver de novo. Digite seu WhatsApp e sua senha."
      />

      <form className="flex w-full flex-col items-start gap-6">
        <Field
          id="telefone"
          label="Seu WhatsApp ou Celular"
          icon={Smartphone}
          hint="O mesmo número que você usou para criar a conta."
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
          id="senha"
          label="Sua Senha"
          icon={Lock}
          hint="Se não lembrar, a gente ajuda pelo WhatsApp."
        >
          <Input
            id="senha"
            name="senha"
            type="password"
            placeholder="Digite sua senha"
            autoComplete="current-password"
          />
        </Field>

        <Button type="submit" size="lg" fullWidth icon={LogIn}>
          ENTRAR NO MEU CADERNO
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

      <Callout
        variant="note"
        icon={PhoneCall}
        description="Não consegue entrar? Fale com a Agrónoma pelo WhatsApp. A gente resolve junto."
      />
    </Card>
  );
}
