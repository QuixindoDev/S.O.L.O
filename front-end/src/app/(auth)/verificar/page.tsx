import type { Metadata } from "next";
import { Check, MessageCircle, Pencil, ShieldCheck, UserRound } from "lucide-react";
import { AuthHero } from "@/components/features/auth/AuthHero";
import { Button, Callout, Card, CodeInputs, PhoneNotice } from "@/components/ui";

export const metadata: Metadata = {
  title: "Confirme o código | S.O.L.O.",
  description: "Digite os 6 números que chegaram no seu SMS.",
};

export default function VerificarPage() {
  return (
    <Card className="max-w-[640px] gap-[22px]">
      <AuthHero
        icon={ShieldCheck}
        iconSize={76}
        titleSize={32}
        title="Confirme o código"
        subtitle="Digite os 6 números que chegaram no seu SMS. É a última etapa para abrir seu caderno."
      />

      <PhoneNotice
        numero="+244 933 3** ***"
        action={
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-[16px] font-bold text-primary hover:bg-surface-soft"
          >
            <Pencil size={18} aria-hidden="true" />
            Mudar número
          </button>
        }
      />

      <CodeInputs />

      <Button size="lg" fullWidth icon={Check}>
        CONFIRMAR E ENTRAR NO CADERNO
      </Button>

      <div className="flex w-full flex-col items-start gap-3">
        <div className="h-px w-full bg-border" />
        <Callout
          variant="help"
          icon={UserRound}
          title="Precisa de ajuda de uma pessoa real?"
          description="Nossa equipe do campo está pronta para te atender com carinho."
          action={
            <Button
              variant="primary"
              pill
              fullWidth
              icon={MessageCircle}
              className="h-[54px] text-[16px]"
            >
              Falar com a Agrónoma
            </Button>
          }
        />
      </div>
    </Card>
  );
}
