import type { Metadata } from "next";
import { PhoneCall, UserRound } from "lucide-react";
import { AuthHero } from "@/components/features/auth/AuthHero";
import { Callout, Card } from "@/components/ui";
import { EntrarForm } from "./EntrarForm";

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

      <EntrarForm />

      <Callout
        variant="note"
        icon={PhoneCall}
        description="Não consegue entrar? Fale com a Agrónoma pelo WhatsApp. A gente resolve junto."
      />
    </Card>
  );
}
