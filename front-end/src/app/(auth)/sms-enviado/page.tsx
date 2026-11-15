import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Hash,
  Keyboard,
  MessageSquare,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { AuthHero } from "@/components/features/auth/AuthHero";
import { StepRow } from "@/components/features/auth/StepRow";
import { Button, Callout, Card, PhoneNotice } from "@/components/ui";

export const metadata: Metadata = {
  title: "Mensagem enviada | S.O.L.O.",
  description: "Enviámos o seu código de segurança por SMS.",
};

const PASSOS = [
  {
    numero: 1,
    title: "Abra suas mensagens normais",
    description: "O aplicativo de Mensagens (SMS) do seu celular.",
    icon: MessageSquare,
  },
  {
    numero: 2,
    title: "Veja os 6 números",
    description: "Foram enviados junto com a mensagem.",
    icon: Hash,
  },
  {
    numero: 3,
    title: "Digite os números aqui",
    description: "Volte a este ecrã e escreva o código.",
    icon: Keyboard,
  },
];

export default function SmsEnviadoPage() {
  return (
    <Card className="max-w-[620px] gap-6">
      <AuthHero
        icon={MessageSquare}
        iconSize={84}
        title="Mensagem enviada!"
        subtitle="Mandamos um SMS comum para o seu celular. É só o código de segurança."
      />

      <PhoneNotice numero="+244 933 300 300" />

      <div className="flex w-full flex-col items-start gap-3.5">
        <h2 className="text-[23px] font-bold text-text-primary">
          Como fazer agora, passo a passo
        </h2>
        {PASSOS.map((passo) => (
          <StepRow key={passo.numero} {...passo} />
        ))}
      </div>

      <Callout
        icon={WifiOff}
        title="Não precisa de internet no celular"
        description="Funciona com sinal fraco. É só receber a mensagem."
      />

      <Button size="lg" fullWidth icon={ArrowRight} iconPosition="right">
        IR AGORA DIGITAR O CÓDIGO
      </Button>

      <div className="flex w-full items-center justify-center">
        <Link
          href="/sms-enviado"
          className="inline-flex items-center gap-2.5 rounded-[4px] text-[18px] font-bold text-text-secondary hover:underline"
        >
          <RefreshCw size={20} aria-hidden="true" />
          Não recebi a mensagem? Tentar de novo
        </Link>
      </div>
    </Card>
  );
}
